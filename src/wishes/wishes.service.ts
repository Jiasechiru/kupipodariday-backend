import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { Wish } from './entities/wish.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createWishDto: CreateWishDto, userId: number): Promise<Wish> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    return this.wishRepository.save({
      ...createWishDto,
      owner: user,
    });
  }

  getLastWishes(): Promise<Wish[]> {
    return this.wishRepository.find({
      order: { createdAt: 'DESC' },
      take: 40,
    });
  }

  getTopWishes(): Promise<Wish[]> {
    return this.wishRepository.find({
      order: { copied: 'desc' },
      take: 20,
    });
  }

  async findOne(id: number): Promise<Wish> {
    const wish = await this.wishRepository.findOne({
      relations: {
        offers: {
          user: true,
        },
        owner: true,
      },
      where: { id },
    });

    if (!wish) {
      throw new BadRequestException('Такого подарка нет');
    }

    return wish;
  }

  async update(
    id: number,
    updateWishDto: UpdateWishDto,
    userId: number,
  ): Promise<Wish> {
    const wish = await this.findWishWithOwnerAndOffers(id, userId);

    if (!wish) {
      throw new BadRequestException('Такого подарка нет');
    }

    if (wish.offers.length > 0) {
      throw new BadRequestException(
        'Внести изменения невозможно после пополнения баланса',
      );
    }

    await this.wishRepository.update(id, updateWishDto);
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<Wish> {
    const wish = await this.wishRepository.findOne({
      where: {
        id,
        owner: { id: userId },
      },
    });

    if (!wish) {
      throw new BadRequestException('Такого подарка нет');
    }

    try {
      return await this.wishRepository.remove(wish);
    } catch (error) {
      throw new ConflictException(
        'Невозможно удалить после пополнения баланса',
      );
    }
  }

  async copy(id: number, userId: number): Promise<Wish> {
    const wish = await this.wishRepository.findOneBy({ id });
    if (!wish) {
      throw new BadRequestException('Такого подарка нет');
    }

    const user = await this.userRepository.findOne({
      relations: { wishes: true },
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const newWish = this.wishRepository.create(wish);
    newWish.copied = 0;
    newWish.raised = 0;
    newWish.owner = user;

    wish.copied += 1;
    await this.wishRepository.save(wish);

    await this.wishRepository.insert(newWish);

    return newWish;
  }

  private async findWishWithOwnerAndOffers(
    id: number,
    userId: number,
  ): Promise<Wish | null> {
    return this.wishRepository.findOne({
      relations: {
        offers: true,
        owner: true,
      },
      where: {
        id,
        owner: { id: userId },
      },
    });
  }
}
