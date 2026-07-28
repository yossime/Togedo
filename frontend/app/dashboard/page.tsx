'use client';

import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc';
import type { TaskStatus } from '@/types/task';

const statusColors: Record<TaskStatus, string> = {
  OPEN: 'bg-gray-100 text-gray-800',
  CLAIMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  DONE: 'bg-green-100 text-green-800',
};

function CardSpinner() {
  return (
    <div className="flex min-h-[120px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: tasks, isLoading: tasksLoading } =
    trpc.tasks.getUserTasks.useQuery();
  const { data: groups, isLoading: groupsLoading } =
    trpc.groups.getUserGroups.useQuery();

  const recentTasks = tasks?.slice(0, 5) ?? [];
  const myGroups = groups?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/groups/new"
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Group
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900">Recent Tasks</h2>
            <div className="mt-6 flow-root">
              {tasksLoading ? (
                <CardSpinner />
              ) : (
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {recentTasks.map((task) => (
                    <li key={task.id} className="py-5">
                      <div className="relative focus-within:ring-2 focus-within:ring-primary-500">
                        <h3 className="text-sm font-semibold text-gray-800">
                          <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                            {task.title}
                          </Link>
                        </h3>
                        <div className="mt-1 flex items-center gap-x-2 text-sm text-gray-500">
                          <p>{task.group.name}</p>
                          {task.dueDate && (
                            <>
                              <span aria-hidden="true">&middot;</span>
                              <p>Due {task.dueDate.toLocaleDateString()}</p>
                            </>
                          )}
                        </div>
                        <span
                          className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[task.status]}`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </li>
                  ))}

                  {recentTasks.length === 0 && (
                    <li className="py-5">
                      <p className="text-center text-sm text-gray-500">
                        No tasks yet. Tasks you create or claim will show up here.
                      </p>
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/tasks"
                className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-primary-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                View all tasks
              </Link>
            </div>
          </div>
        </div>

        {/* My Groups */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900">My Groups</h2>
            <div className="mt-6 flow-root">
              {groupsLoading ? (
                <CardSpinner />
              ) : (
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                  {myGroups.map((group) => (
                    <li key={group.id} className="py-5">
                      <div className="relative focus-within:ring-2 focus-within:ring-primary-500">
                        <h3 className="text-sm font-semibold text-gray-800">
                          <Link href={`/dashboard/groups/${group.id}`} className="hover:underline">
                            {group.name}
                          </Link>
                        </h3>
                        <div className="mt-1 flex items-center gap-x-2 text-sm text-gray-500">
                          <p>{group._count.members} members</p>
                          <span aria-hidden="true">&middot;</span>
                          <p>{group._count.tasks} tasks</p>
                        </div>
                      </div>
                    </li>
                  ))}

                  {myGroups.length === 0 && (
                    <li className="py-5">
                      <p className="text-center text-sm text-gray-500">
                        No groups yet. Create one to start collaborating.
                      </p>
                    </li>
                  )}
                </ul>
              )}
            </div>
            <div className="mt-6">
              <Link
                href="/dashboard/groups"
                className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-primary-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                View all groups
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
