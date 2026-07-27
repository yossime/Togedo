'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';

const createGroupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function NewGroupPage() {
  const [error, setError] = useState('');
  const router = useRouter();
  const createGroup = trpc.groups.create.useMutation({
    onSuccess: (group) => {
      router.push(`/dashboard/groups/${group.id}`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
  });

  const onSubmit = async (data: CreateGroupForm) => {
    try {
      await createGroup.mutateAsync(data);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create New Group</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new group to collaborate on tasks with your team.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Group Name
            </label>
            <div className="mt-2">
              <input
                {...register('name')}
                type="text"
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                placeholder="Enter group name"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 