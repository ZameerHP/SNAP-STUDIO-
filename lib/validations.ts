import { z } from 'zod'

export const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().or(z.literal('')),
  service: z.string().min(1, 'Please select a service'),
  budget: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  date: z.string().optional().or(z.literal('')),
  timeSlot: z.string().optional().or(z.literal('')),
  message: z.string().min(5, 'Message must be at least 5 characters'),
})

export type InquiryInput = z.infer<typeof inquirySchema>

export const loginSchema = z.object({
  email: z.string().min(2, 'Please enter your email or identifier'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
