'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { TASK_STATUSES, type TaskStatus } from '@/types/task';

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  assigneeId: z.string().nullable().optional(),
});

type UpdateTaskForm = z.infer<typeof updateTaskSchema>;

const statusColors: Record<TaskStatus, string> = {
  OPEN: 'bg-gray-100 text-gray-800',
  CLAIMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
};

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  const { data: task, isLoading } = trpc.tasks.getTask.useQuery(taskId);
  const updateTask = trpc.tasks.update.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      setError('');
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UpdateTaskForm>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task?.title || undefined,
      description: task?.description || undefined,
      status: task?.status,
      dueDate: task?.dueDate?.toISOString(),
      tags: task?.tags,
      assigneeId: task?.assigneeId || undefined,
    },
  });

  const onSubmit = async (data: UpdateTaskForm) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        ...data,
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 h-12 w-12"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Task not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-x-3">
          <button
            onClick={() => router.back()}
            className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          {isEditing ? (
            <input
              {...register('title')}
              type="text"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
          )}
        </div>
        <div className="mt-4 flex gap-x-3 sm:mt-0">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Edit Task
            </button>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Status */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-900">Status</h2>
              <div className="mt-4">
                {isEditing ? (
                  <select
                    {...register('status')}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[task.status]
                    }`}
                  >
                    {task.status === 'OPEN' && (
                      <ClockIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                    )}
                    {task.status === 'IN_PROGRESS' && (
                      <ArrowPathIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                    )}
                    {task.status === 'DONE' && (
                      <CheckCircleIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                    )}
                    {task.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-900">Description</h2>
              <div className="mt-4">
                {isEditing ? (
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    {task.description || 'No description provided.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Details */}
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-900">Details</h2>
              <dl className="mt-4 space-y-4">
                <div className="flex items-center">
                  <dt className="flex items-center text-sm font-medium text-gray-500">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Assignee
                  </dt>
                  <dd className="ml-auto text-sm text-gray-900">
                    {task.assignee ? task.assignee.name : 'Unassigned'}
                  </dd>
                </div>
                <div className="flex items-center">
                  <dt className="flex items-center text-sm font-medium text-gray-500">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Due Date
                  </dt>
                  <dd className="ml-auto text-sm text-gray-900">
                    {task.dueDate
                      ? task.dueDate.toLocaleDateString()
                      : 'No due date'}
                  </dd>
                </div>
                <div className="flex items-center">
                  <dt className="flex items-center text-sm font-medium text-gray-500">
                    <TagIcon className="h-5 w-5 mr-2" />
                    Tags
                  </dt>
                  <dd className="ml-auto">
                    <div className="flex flex-wrap gap-2">
                      {task.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {(!task.tags || task.tags.length === 0) && (
                        <span className="text-sm text-gray-500">No tags</span>
                      )}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 