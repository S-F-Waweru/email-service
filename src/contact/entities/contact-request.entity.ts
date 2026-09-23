import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('contact_requests')
export class ContactRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  idempotencyKey: string;

  @Column()
  siteId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  subject: string;

  @Column('text')
  message: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'queued' | 'sent' | 'failed';

  @CreateDateColumn()
  createdAt: Date;
}
