import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const viberyAppSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'contacts',
      columns: [
        { name: 'display_name', type: 'string' },
        { name: 'avatar_url', type: 'string', isOptional: true },
        { name: 'primary_email', type: 'string', isIndexed: true },
        { name: 'linked_emails_json', type: 'string' },
        { name: 'is_service', type: 'boolean' },
        { name: 'category', type: 'string' },
        { name: 'organization', type: 'string', isOptional: true },
        { name: 'total_messages', type: 'number' },
        { name: 'first_contact_date', type: 'string' },
        { name: 'avg_response_minutes', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'conversations',
      columns: [
        { name: 'contact_id', type: 'string', isIndexed: true },
        { name: 'subject_context', type: 'string' },
        { name: 'last_message_snippet', type: 'string' },
        { name: 'last_message_timestamp', type: 'number', isIndexed: true },
        { name: 'unread_count', type: 'number' },
        { name: 'is_archived', type: 'boolean', isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'provider_badge', type: 'string' },
        { name: 'total_messages', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'conversation_id', type: 'string', isIndexed: true },
        { name: 'provider_message_id', type: 'string', isIndexed: true },
        { name: 'provider', type: 'string' },
        { name: 'sender_email', type: 'string' },
        { name: 'sender_name', type: 'string' },
        { name: 'clean_body', type: 'string' },
        { name: 'greeting', type: 'string', isOptional: true },
        { name: 'collapsed_quote', type: 'string', isOptional: true },
        { name: 'signature', type: 'string', isOptional: true },
        { name: 'timestamp', type: 'number', isIndexed: true },
        { name: 'is_outgoing', type: 'boolean' },
        { name: 'status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'attachments',
      columns: [
        { name: 'message_id', type: 'string', isIndexed: true },
        { name: 'filename', type: 'string' },
        { name: 'mime_type', type: 'string' },
        { name: 'size_bytes', type: 'number' },
        { name: 'download_url', type: 'string' },
        { name: 'local_cache_path', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
      ],
    }),
  ],
});
