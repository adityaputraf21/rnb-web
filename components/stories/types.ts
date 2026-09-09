export type StoryItem = {
  id: string;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  createdAt: string;
  viewed: boolean;
  views: number;
  mine: boolean;
};

export type StoryGroup = {
  username: string;
  name: string | null;
  image: string | null;
  allViewed: boolean;
  items: StoryItem[];
};
