import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransactionEntity } from './transaction.entity';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Index()
  transactionId!: string;

  @ManyToOne(() => TransactionEntity, tx => tx.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transactionId' })
  transaction!: TransactionEntity;

  @Column()
  event!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;
}
