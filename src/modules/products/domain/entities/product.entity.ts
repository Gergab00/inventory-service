export type ProductStatus = 'active' | 'inactive';

export interface ProductExternalIdentifier {
  readonly type: string;
  readonly value: string;
  readonly provider?: string;
  readonly marketplaceId?: string;
}

export interface ProductImageReference {
  readonly id: string;
  readonly url: string;
  readonly role: string;
}

export interface ProductPrimitives {
  id: string;
  title: string;
  brand: string;
  status: ProductStatus;
  externalIdentifiers: ProductExternalIdentifier[];
  attributes: Record<string, string>;
  imageReferences: ProductImageReference[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductParams {
  readonly id: string;
  readonly title: string;
  readonly brand: string;
  readonly status?: ProductStatus;
  readonly externalIdentifiers?: ProductExternalIdentifier[];
  readonly attributes?: Record<string, string>;
  readonly imageReferences?: ProductImageReference[];
}

export interface UpdateProductParams {
  readonly title?: string;
  readonly brand?: string;
  readonly status?: ProductStatus;
  readonly externalIdentifiers?: ProductExternalIdentifier[];
  readonly attributes?: Record<string, string>;
}

export class Product {
  private constructor(private props: ProductPrimitives) {}

  static create(params: CreateProductParams): Product {
    const now = new Date().toISOString();

    return new Product({
      id: Product.requireText('id', params.id),
      title: Product.requireText('title', params.title),
      brand: Product.requireText('brand', params.brand),
      status: params.status ?? 'active',
      externalIdentifiers: Product.cloneExternalIdentifiers(
        params.externalIdentifiers ?? [],
      ),
      attributes: Product.cloneAttributes(params.attributes),
      imageReferences: Product.cloneImageReferences(params.imageReferences ?? []),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(primitives: ProductPrimitives): Product {
    return new Product(Product.clonePrimitives(primitives));
  }

  update(params: UpdateProductParams): void {
    if (params.title !== undefined) {
      this.props.title = Product.requireText('title', params.title);
    }

    if (params.brand !== undefined) {
      this.props.brand = Product.requireText('brand', params.brand);
    }

    if (params.status !== undefined) {
      this.props.status = params.status;
    }

    if (params.externalIdentifiers !== undefined) {
      this.props.externalIdentifiers = Product.cloneExternalIdentifiers(
        params.externalIdentifiers,
      );
    }

    if (params.attributes !== undefined) {
      this.props.attributes = Product.cloneAttributes(params.attributes);
    }

    this.touch();
  }

  replaceImageReferences(imageReferences: readonly ProductImageReference[]): void {
    this.props.imageReferences = Product.cloneImageReferences(imageReferences);
    this.touch();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.touch();
  }

  toPrimitives(): ProductPrimitives {
    return Product.clonePrimitives(this.props);
  }

  private touch(): void {
    this.props.updatedAt = new Date().toISOString();
  }

  private static clonePrimitives(primitives: ProductPrimitives): ProductPrimitives {
    return {
      ...primitives,
      externalIdentifiers: Product.cloneExternalIdentifiers(
        primitives.externalIdentifiers,
      ),
      attributes: Product.cloneAttributes(primitives.attributes),
      imageReferences: Product.cloneImageReferences(primitives.imageReferences),
    };
  }

  private static cloneExternalIdentifiers(
    identifiers: readonly ProductExternalIdentifier[],
  ): ProductExternalIdentifier[] {
    return identifiers.map((identifier) => ({ ...identifier }));
  }

  private static cloneImageReferences(
    imageReferences: readonly ProductImageReference[],
  ): ProductImageReference[] {
    return imageReferences.map((imageReference) => ({ ...imageReference }));
  }

  private static cloneAttributes(
    attributes: Record<string, string> | undefined,
  ): Record<string, string> {
    return Object.fromEntries(
      Object.entries(attributes ?? {}).map(([key, value]) => [key, String(value)]),
    );
  }

  private static requireText(fieldName: string, value: string): string {
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      throw new Error(`Product ${fieldName} is required.`);
    }

    return normalizedValue;
  }
}
