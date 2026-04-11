import { Inject, Injectable } from '@nestjs/common';
import { Collection, type Filter, type Document } from 'mongodb';
import { MONGO_DATABASE } from '../../../../infrastructure/persistence/mongodb/mongodb.tokens';
import { Db } from 'mongodb';
import { Product, ProductPrimitives } from '../../domain/entities/product.entity';
import {
  ListProductsFilters,
  PaginatedProductsResult,
  ProductRepository,
} from '../../domain/ports/product.repository.port';

interface ProductIdentifierDocument {
  type: string;
  value: string;
  provider?: string;
  marketplaceId?: string;
  typeNormalized: string;
  valueNormalized: string;
}

interface ProductDocument extends Document, ProductPrimitives {
  titleNormalized: string;
  brandNormalized: string;
  externalIdentifiers: ProductIdentifierDocument[];
}

@Injectable()
export class MongoProductRepository implements ProductRepository {
  constructor(@Inject(MONGO_DATABASE) private readonly database: Db) {}

  async save(product: Product): Promise<void> {
    const primitives = product.toPrimitives();

    const document: ProductDocument = {
      ...primitives,
      titleNormalized: normalize(primitives.title),
      brandNormalized: normalize(primitives.brand),
      externalIdentifiers: primitives.externalIdentifiers.map((identifier) => ({
        ...identifier,
        typeNormalized: normalize(identifier.type),
        valueNormalized: normalize(identifier.value),
      })),
    };

    await this.getCollection().updateOne(
      { id: primitives.id },
      { $set: document },
      { upsert: true },
    );
  }

  async findById(productId: string): Promise<Product | null> {
    const document = await this.getCollection().findOne({ id: productId });
    return document === null ? null : Product.reconstitute(toPrimitives(document));
  }

  async findByExternalIdentifier(
    type: string,
    value: string,
  ): Promise<Product | null> {
    const document = await this.getCollection().findOne({
      externalIdentifiers: {
        $elemMatch: {
          typeNormalized: normalize(type),
          valueNormalized: normalize(value),
        },
      },
    });

    return document === null ? null : Product.reconstitute(toPrimitives(document));
  }

  async findAll(filters: ListProductsFilters): Promise<PaginatedProductsResult> {
    const page = Math.max(filters.page, 1);
    const pageSize = Math.max(filters.pageSize, 1);
    const query = buildQuery(filters);

    const total = await this.getCollection().countDocuments(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    const documents = await this.getCollection()
      .find(query)
      .sort({ createdAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return {
      items: documents.map((document) => Product.reconstitute(toPrimitives(document))),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  private getCollection(): Collection<ProductDocument> {
    return this.database.collection<ProductDocument>('products');
  }
}

function toPrimitives(document: ProductDocument): ProductPrimitives {
  return {
    id: document.id,
    title: document.title,
    brand: document.brand,
    status: document.status,
    externalIdentifiers: document.externalIdentifiers.map((identifier) => ({
      type: identifier.type,
      value: identifier.value,
      provider: identifier.provider,
      marketplaceId: identifier.marketplaceId,
    })),
    attributes: { ...document.attributes },
    imageReferences: document.imageReferences.map((imageReference) => ({
      ...imageReference,
    })),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function buildQuery(filters: ListProductsFilters): Filter<ProductDocument> {
  const query: Filter<ProductDocument> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.title) {
    query.titleNormalized = {
      $regex: escapeRegExp(normalize(filters.title)),
    };
  }

  if (filters.brand) {
    query.brandNormalized = {
      $regex: escapeRegExp(normalize(filters.brand)),
    };
  }

  if (filters.identifierType || filters.identifierValue) {
    query.externalIdentifiers = {
      $elemMatch: {
        ...(filters.identifierType
          ? { typeNormalized: normalize(filters.identifierType) }
          : {}),
        ...(filters.identifierValue
          ? { valueNormalized: normalize(filters.identifierValue) }
          : {}),
      },
    };
  }

  return query;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
