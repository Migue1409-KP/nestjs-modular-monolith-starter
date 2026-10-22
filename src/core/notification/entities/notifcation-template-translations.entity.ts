import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { NotificationTemplate } from './notification-templates.entity';
import { Language } from '@/core/parameters/entities/languages.entity';

@Entity('notification_template_translations')
@Unique('UQ_notification_template_translations_template_language', ['template', 'language'])
export class NotificationTemplateTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => NotificationTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template' })
  template: NotificationTemplate;

  @ManyToOne(() => Language, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'language' })
  language: Language;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ name: 'html_template', type: 'text', nullable: true })
  htmlTemplate: string;

  @Column({ name: 'sms_template', type: 'text', nullable: true })
  smsTemplate: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
