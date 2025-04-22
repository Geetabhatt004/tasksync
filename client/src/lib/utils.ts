import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'No date set';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(dateObj);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'No date set';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(dateObj);
}

export const priorityColors = {
  low: {
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
  },
  high: {
    bg: 'bg-red-100',
    text: 'text-red-800',
  },
};

export const statusColors = {
  todo: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
  },
  inProgress: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  review: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  done: {
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  overdue: {
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
};

export const statusMapping = {
  todo: 'To Do',
  inProgress: 'In Progress',
  review: 'Review',
  done: 'Done',
  overdue: 'Overdue',
};

export const priorityMapping = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
