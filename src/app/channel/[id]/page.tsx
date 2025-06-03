import { getChannelVideos, getChannelInfo } from '@/lib/youtube';
import { VideoLayout } from '@/components/video/VideoLayout';
import { ChannelHeader } from '@/components/video/ChannelHeader';

interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

interface VideoResponse {
  videos: Video[];
  nextPageToken?: string;
}

export default async function ChannelPage({
  params,
}: {
  params: { id: string };
}) {
  let videoResponse: VideoResponse = { videos: [] };
  let error = null;
  const { id } = await params;

  // チャンネル情報のPromiseを作成
  const channelInfoPromise = getChannelInfo(id);

  try {
    videoResponse = await getChannelVideos(id);
  } catch (e) {
    error = e instanceof Error ? e.message : '情報の取得に失敗しました';
  }

  return (
    <main className="min-h-screen">
      <ChannelHeader channelInfoPromise={channelInfoPromise} />

      {error ? (
        <div className="px-4 text-red-500">{error}</div>
      ) : videoResponse.videos.length === 0 ? (
        <div className="px-4 text-gray-500">動画が見つかりませんでした</div>
      ) : (
        <VideoLayout 
          channelId={id} 
          initialVideos={videoResponse.videos} 
          nextPageToken={videoResponse.nextPageToken} 
        />
      )}
    </main>
  );
}
