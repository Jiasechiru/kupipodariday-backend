import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  IsNumber,
} from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  @Length(1, 250)
  name: string;

  @IsString()
  @IsUrl()
  image: string;

  @IsArray()
  @IsNumber({}, { each: true })
  itemsId: number[];

  @IsString()
  @Length(1, 1500)
  @IsOptional()
  description: string;
}
