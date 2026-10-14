export type ProductImage = {
  src: string;
  variantIds: number[];
  isDefault: boolean;
};

export type ProductOptionValue = {
  id: number;
  title: string;
  colors: string[];
};

export type ProductOption = {
  name: string;
  type: string;
  values: ProductOptionValue[];
};

export type ProductVariant = {
  id: number;
  title: string;
  price: number;
  enabled: boolean;
  isDefault: boolean;
  optionIds: number[];
};

export type ProductView = {
  id: string;
  title: string;
  description: string;
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
};

export type ProductSummary = {
  id: string;
  title: string;
  imageSrc: string | null;
  priceLabel: string | null;
};
