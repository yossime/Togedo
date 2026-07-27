'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import {
  PlusIcon,
  UserPlusIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface GroupMembership {
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: 'MANAGER' | 'MEMBER';
}

interface Task {
  id: string;
  title: string;
  status: 'IN_PROGRESS' | 'DONE' | 'TODO';
  dueDate?: string;
  assignee?: {
    name: string;
  };
}

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const { data: group, isLoading } = trpc.groups.getGroup.useQuery(groupId);
  const inviteMember = trpc.groups.inviteMember.useMutation({
    onSuccess: () => {
      setShowInviteForm(false);
      setInviteError('');
    },
    onError: (error) => {
      setInviteError(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
  });

  const onInvite = async (data: InviteMemberForm) => {
    try {
      await inviteMember.mutateAsync({ groupId, email: data.email });
      reset();
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

  if (!group) {
    return (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Group not found</h3>
      </div>
    );
  }

  const isManager = group.members.some(
    (m: GroupMembership) => m.user.id === group.ownerId && m.role === 'MANAGER'
  );

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
          <h1 className="text-2xl font-semibold text-gray-900">{group.name}</h1>
        </div>
        <div className="mt-4 flex gap-x-3 sm:mt-0">
          {isManager && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <UserPlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Invite Member
            </button>
          )}
          <Link
            href={`/dashboard/groups/${groupId}/tasks/new`}
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            New Task
          </Link>
        </div>
      </div>

      {showInviteForm && (
        <div className="rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Invite Member
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Invite a new member to join this group.</p>
            </div>
            <form onSubmit={handleSubmit(onInvite)} className="mt-5 sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div className="mt-3 sm:ml-4 sm:mt-0">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="block w-full rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto"
                >
                  {isSubmitting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
            {inviteError && (
              <p className="mt-2 text-sm text-red-600">{inviteError}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Members List */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900">Members</h2>
            <div className="mt-6 flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {group.members.map((membership: GroupMembership) => (
                  <li key={membership.user.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                          <span className="text-sm font-medium leading-none text-primary-700">
                            {membership.user.name[0]}
                          </span>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {membership.user.name}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {membership.user.email}
                        </p>
                      </div>
                      {membership.role === 'MANAGER' && (
                        <div>
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                            Manager
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-base font-semibold text-gray-900">Recent Tasks</h2>
            <div className="mt-6 flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {group.tasks.map((task: Task) => (
                  <li key={task.id} className="py-4">
                    <div className="relative focus-within:ring-2 focus-within:ring-primary-500">
                      <h3 className="text-sm font-semibold text-gray-800">
                        <Link href={`/dashboard/tasks/${task.id}`} className="hover:underline">
                          {task.title}
                        </Link>
                      </h3>
                      <div className="mt-1 flex items-center gap-x-2 text-sm text-gray-500">
                        {task.assignee ? (
                          <p>Assigned to {task.assignee.name}</p>
                        ) : (
                          <p>Unassigned</p>
                        )}
                        {task.dueDate && (
                          <>
                            <span aria-hidden="true">&middot;</span>
                            <p>Due {new Date(task.dueDate).toLocaleDateString()}</p>
                          </>
                        )}
                      </div>
                      <span
                        className={`mt-2 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          task.status === 'IN_PROGRESS'
                            ? 'bg-yellow-100 text-yellow-800'
                            : task.status === 'DONE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </li>
                ))}

                {group.tasks.length === 0 && (
                  <li className="py-4">
                    <div className="text-center text-sm text-gray-500">
                      No tasks yet. Create one to get started!
                    </div>
                  </li>
                )}
              </ul>
            </div>
            <div className="mt-6">
              <Link
                href={`/dashboard/groups/${groupId}/tasks`}
                className="flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-primary-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                View all tasks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 