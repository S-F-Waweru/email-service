import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';

export class CreateContactRequests1727200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'contact_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            isGenerated: true,
          },
          { name: 'idempotencyKey', type: 'varchar', isUnique: true },
          { name: 'siteId', type: 'varchar' },
          { name: 'fullName', type: 'varchar', length: '150' },
          { name: 'email', type: 'varchar', length: '254' },
          { name: 'phoneNumber', type: 'varchar', length: '30' },
          { name: 'company', type: 'varchar', length: '150', isNullable: true },
          { name: 'subject', type: 'varchar', length: '200', isNullable: true },
          { name: 'message', type: 'text' },
          { name: 'status', type: 'varchar', default: "'pending'" },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contact_requests');
  }
}
