export type FeedbackRating = 'helpful' | 'needs_work';

export interface FeedbackEntry {
  id: string;
  user_id: string;
  chat_id?: string;
  message_id?: string;
  user_message?: string;
  assistant_message?: string;
  rating: FeedbackRating;
  note?: string;
  created_at: string;
}

export interface FeedbackCreateRequest {
  chat_id?: string;
  message_id?: string;
  user_message?: string;
  assistant_message?: string;
  rating: FeedbackRating;
  note?: string;
}
