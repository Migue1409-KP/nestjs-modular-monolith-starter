import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NotificationTemplate } from './notification-templates.entity';

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => NotificationTemplate)
  @JoinColumn({ name: 'template' })
  template: NotificationTemplate;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  phone: string;

  @Column({ type: 'text', name: 'body_html', nullable: true })
  bodyHtml: string;

  @Column({ type: 'text', name: 'body_text', nullable: true })
  bodyText: string;

  @Column({ type: 'jsonb', default: {} })
  params: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationStatus.SENT,
  })
  status: NotificationStatus;

  @Column({ type: 'timestamptz', name: 'sent_at', default: () => 'CURRENT_TIMESTAMP' })
  sentAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
