export class Model {
  async findUnique(_args?: any): Promise<any> { return null }
  async findFirst(_args?: any): Promise<any> { return null }
  async findMany(_args?: any): Promise<any[]> { return [] }
  async create(_args?: any): Promise<any> { return null }
  async update(_args?: any): Promise<any> { return null }
  async delete(_args?: any): Promise<any> { return null }
  async count(_args?: any): Promise<number> { return null }
}

import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  constructor() {
    super();
  }

}
