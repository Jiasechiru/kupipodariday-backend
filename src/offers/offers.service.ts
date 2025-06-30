import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Offer } from './entities/offer.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
  ) {}

  async create(createOfferDto: CreateOfferDto, userId: number): Promise<Offer> {
    const { itemId, amount } = createOfferDto;

    const user = await this.findUserWithWishes(userId);
    const wish = await this.findWishById(itemId);

    this.validateOffer(user, wish, amount);

    const updatedAmount = Number(wish.raised) + amount;
    wish.raised = updatedAmount;
    await this.wishRepository.save(wish);

    return this.offerRepository.save({
      ...createOfferDto,
      user,
      item: wish,
    });
  }

  getAllOffers(): Promise<Offer[]> {
    return this.offerRepository.find({
      relations: {
        user: true,
        item: true,
      },
    });
  }

  findOne(id: number): Promise<Offer> {
    return this.offerRepository.findOneBy({ id });
  }

  private async findUserWithWishes(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      relations: { wishes: true },
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    return user;
  }

  private async findWishById(itemId: number): Promise<Wish> {
    const wish = await this.wishRepository.findOneBy({ id: itemId });

    if (!wish) {
      throw new BadRequestException('Такого подарка нет');
    }

    return wish;
  }

  private validateOffer(user: User, wish: Wish, amount: number): void {
    const isOwnWish = user.wishes.some((item) => item.id === wish.id);
    if (isOwnWish) {
      throw new BadRequestException('Нельзя платить за свой подарок');
    }

    const updatedSum = Number(wish.raised) + amount;
    if (updatedSum > wish.price) {
      throw new BadRequestException('Денег больше чем нужно');
    }
  }
}
