'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { trpc } from '@/lib/trpc';
import type { inferProcedureOutput } from '@trpc/server';
import type { AppRouter } from '@/lib/trpc';

export default function GroupsPage() {
  const router = useRouter();
  const { data: groups, isLoading } = trpc.groups.getUserGroups.useQuery();

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
        <h1 className="text-2xl font-semibold text-gray-900">My Groups</h1>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups?.map((group: inferProcedureOutput<AppRouter['groups']['getUserGroups']>[number]) => (
          <div
            key={group.id}
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-primary-400 cursor-pointer"
            onClick={() => router.push(`/dashboard/groups/${group.id}`)}
          >
            <div className="flex-shrink-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                <UserGroupIcon className="h-6 w-6 text-primary-600" aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="focus:outline-none">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{group.name}</p>
                <div className="mt-1 flex items-center gap-x-2 text-sm text-gray-500">
                  <p>{group._count.members} members</p>
                  <span aria-hidden="true">&middot;</span>
                  <p>{group._count.tasks} tasks</p>
                </div>
                {group.members[0].role === 'MANAGER' && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                    Manager
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {groups?.length === 0 && (
          <div className="col-span-full">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No groups</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new group.</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/groups/new"
                  className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  New Group
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 