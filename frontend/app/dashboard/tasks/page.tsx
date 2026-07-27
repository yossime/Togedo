'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { type AppRouter } from '@/lib/trpc';
import { type inferProcedureOutput } from '@trpc/server';

const statusColors = {
  OPEN: 'bg-gray-100 text-gray-800',
  CLAIMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
} as const;

type TaskStatus = keyof typeof statusColors;

export default function TasksPage() {
  const router = useRouter();
  const { data: tasks, isLoading } = trpc.tasks.getUserTasks.useQuery();
  type Task = NonNullable<typeof tasks>[number];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <ul role="list" className="divide-y divide-gray-200">
          {tasks?.map((task: Task) => (
            <li
              key={task.id}
              className="relative bg-white px-4 py-5 hover:bg-gray-50 sm:px-6"
            >
              <div className="flex items-center justify-between space-x-4">
                <div className="min-w-0 space-y-3">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[task.status as TaskStatus]
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
                    <h2 className="text-sm font-medium text-gray-900">
                      <Link
                        href={`/dashboard/tasks/${task.id}`}
                        className="hover:underline"
                      >
                        {task.title}
                      </Link>
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{task.group.name}</span>
                    {task.assignee && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span>Assigned to {task.assignee.name}</span>
                      </>
                    )}
                    {task.dueDate && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-none items-center space-x-4">
                  {task.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 cursor-pointer" onClick={() => router.push(`/dashboard/tasks/${task.id}`)} />
            </li>
          ))}

          {tasks?.length === 0 && (
            <li className="px-4 py-20 text-center sm:px-6">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ClockIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No tasks</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any tasks assigned to you.
              </p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
} 