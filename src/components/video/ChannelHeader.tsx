'use client';

import { use } from 'react';
import Image from 'next/image';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { ChannelInfo } from '@/types/youtube';

interface ChannelHeaderProps {
  channelInfoPromise: Promise<ChannelInfo>;
}

export function ChannelHeader({ channelInfoPromise }: ChannelHeaderProps) {
  const channelInfo = use(channelInfoPromise);

  return (
    <div className="p-4 flex flex-row gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className='flex items-center gap-2'>
              <Image
                src={channelInfo.thumbnails.medium.url}
                alt={channelInfo.title}
                width={30}
                height={30}
                className="rounded-full"
              />
              {channelInfo.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="text-sm text-gray-500 mt-1 pl-4 line-clamp-2 flex-1">
        {channelInfo.description}
      </p>
    </div>
  );
} 