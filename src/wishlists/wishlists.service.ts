import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
  ) {}

  async create(
    createWishlistDto: CreateWishlistDto,
    userId: number,
  ): Promise<Wishlist> {
    const { itemsId, ...wishlistData } = createWishlistDto;

    const user = await this.findUserById(userId);
    const wishes = await this.findWishesByIds(itemsId);

    const wishlist = this.wishlistRepository.create({
      ...wishlistData,
      owner: user,
      items: wishes,
    });

    return this.wishlistRepository.save(wishlist);
  }

  getAllWishlists(): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      relations: {
        items: true,
        owner: true,
      },
    });
  }

  async getWishListById(id: number): Promise<Wishlist> {
    const wishlist = await this.wishlistRepository.findOne({
      relations: {
        items: true,
        owner: true,
      },
      where: { id },
    });

    if (!wishlist) {
      throw new BadRequestException('Вишлист не найден');
    }

    return wishlist;
  }

  async remove(id: number, userId: number): Promise<Wishlist> {
    const wishlist = await this.findWishlistWithOwner(id, userId);

    if (!wishlist) {
      throw new BadRequestException('Вишлист не найден');
    }

    return await this.wishlistRepository.remove(wishlist);
  }

  async update(
    id: number,
    updateWishlistDto: UpdateWishlistDto,
    userId: number,
  ): Promise<Wishlist> {
    const wishlist = await this.findWishlistWithOwnerAndItems(id);

    if (!wishlist) {
      throw new BadRequestException('Вишлист не найден');
    }

    if (wishlist.owner.id !== userId) {
      throw new BadRequestException('Нельзя менять чужой вишлист');
    }

    await this.updateWishlistData(wishlist, updateWishlistDto);
    return this.wishlistRepository.save(wishlist);
  }

  private async findUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    return user;
  }

  private async findWishesByIds(itemsId: number[]): Promise<Wish[]> {
    const wishItems = itemsId.map((id) => ({ id }));
    return this.wishRepository.find({ where: wishItems });
  }

  private async findWishlistWithOwner(
    id: number,
    userId: number,
  ): Promise<Wishlist | null> {
    return this.wishlistRepository.findOne({
      relations: { owner: true },
      where: {
        id,
        owner: { id: userId },
      },
    });
  }

  private async findWishlistWithOwnerAndItems(
    id: number,
  ): Promise<Wishlist | null> {
    return this.wishlistRepository.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });
  }

  private async updateWishlistData(
    wishlist: Wishlist,
    updateData: UpdateWishlistDto,
  ): Promise<void> {
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'itemsId') {
        const wishItems = (value as number[]).map((id) => ({ id }));
        const wishes = await this.wishRepository.find({ where: wishItems });
        wishlist.items = wishes;
      } else {
        wishlist[key] = value;
      }
    }
  }
}
