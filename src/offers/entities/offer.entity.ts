import { Entity, Column, ManyToOne } from 'typeorm';
import { IsNumber } from 'class-validator';

import { MainEntity } from 'src/shared/MainEntity';
import { User } from 'src/users/entities/user.entity';
import { Wish } from 'src/wishes/entities/wish.entity';

@Entity()
export class Offer extends MainEntity {
  @IsNumber()
  @Column({
    type: 'numeric',
  })
  amount: number;

  @Column({ default: false })
  hidden: boolean;

  // Relations
  @ManyToOne(() => User, (user) => user.offers)
  user: User;

  @ManyToOne(() => Wish, (wish) => wish.offers)
  item: Wish;
}
