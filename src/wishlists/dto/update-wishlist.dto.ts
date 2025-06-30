import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  IsNumber,
} from 'class-validator';

export class UpdateWishlistDto {
  @IsString()
  @Length(1, 250)
  @IsOptional()
  name: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  image: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  itemsId: number[];

  @IsString()
  @Length(1, 1500)
  @IsOptional()
  description: string;
}
