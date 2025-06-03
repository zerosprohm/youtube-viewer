'use server';

const API_KEY = process.env.YOUTUBE_API_KEY;

export async function getChannelVideos(channelId: string, pageToken?: string) {
  console.log('channelId', channelId);
  if (!API_KEY) {
    throw new Error('YouTube APIキーが設定されていません');
  }

  const params = new URLSearchParams({
    part: 'snippet',
    channelId,
    maxResults: '50',
    order: 'date',
    type: 'video',
    key: API_KEY,
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  try {
    // チャンネルIDの形式を確認
    let finalChannelId = channelId;

    // @で始まる場合（ハンドル名）
    if (channelId.startsWith('@') || channelId.startsWith('%40')) {
      const username = channelId.startsWith('@') 
        ? channelId.slice(1) 
        : decodeURIComponent(channelId).slice(1);

      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&forUsername=${username}&part=id`
      );
      
      if (!channelResponse.ok) {
        const error = await channelResponse.json();
        console.error('Channel API Error:', error);
        throw new Error('チャンネル情報の取得に失敗しました');
      }

      const channelData = await channelResponse.json();
      if (!channelData.items?.[0]?.id) {
        throw new Error('チャンネルが見つかりませんでした');
      }

      finalChannelId = channelData.items[0].id;
    }

    // 動画一覧を取得
    const params = new URLSearchParams({
      part: 'snippet',
      channelId: finalChannelId,
      maxResults: '50',
      order: 'date',
      type: 'video',
      key: API_KEY,
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    console.log('Fetching videos with params:', params.toString());

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('YouTube API Error Response:', error);
      throw new Error(error.error?.message || '動画の取得に失敗しました');
    }

    const data = await response.json();
    return {
      videos: data.items || [],
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('YouTube API Error:', error);
    throw error;
  }
}

export async function getVideoComments(videoId: string, pageToken?: string) {
  if (!API_KEY) {
    throw new Error('YouTube APIキーが設定されていません');
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      videoId,
      part: 'snippet,replies',
      maxResults: '50',
      order: 'relevance',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('YouTube API Error Response:', error);
      throw new Error(error.error?.message || 'コメントの取得に失敗しました');
    }

    const data = await response.json();
    console.log('data nextPageToken', data.nextPageToken);
    return {
      comments: data.items.map((item: any) => ({
        id: item.id,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        replies: item.replies?.comments?.map((reply: any) => ({
          id: reply.id,
          text: reply.snippet.textDisplay,
          author: reply.snippet.authorDisplayName,
          publishedAt: reply.snippet.publishedAt,
          likeCount: reply.snippet.likeCount,
        })) || [],
      })),
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('YouTube API Error:', error);
    throw error;
  }
}

export async function getChannelInfo(channelId: string) {
  if (!API_KEY) {
    throw new Error('YouTube APIキーが設定されていません');
  }

  try {
    // @で始まる場合（ハンドル名）
    if (channelId.startsWith('@') || channelId.startsWith('%40')) {
      const username = channelId.startsWith('@') 
        ? channelId.slice(1) 
        : decodeURIComponent(channelId).slice(1);

      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&forUsername=${username}&part=snippet`
      );
      
      if (!channelResponse.ok) {
        const error = await channelResponse.json();
        console.error('Channel API Error:', error);
        throw new Error('チャンネル情報の取得に失敗しました');
      }

      const channelData = await channelResponse.json();
      if (!channelData.items?.[0]) {
        throw new Error('チャンネルが見つかりませんでした');
      }

      return {
        title: channelData.items[0].snippet.title,
        description: channelData.items[0].snippet.description,
        thumbnails: channelData.items[0].snippet.thumbnails,
      };
    }

    // 通常のチャンネルIDの場合
    const params = new URLSearchParams({
      key: API_KEY,
      part: 'snippet',
      id: channelId,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('YouTube API Error Response:', error);
      throw new Error(error.error?.message || 'チャンネル情報の取得に失敗しました');
    }

    const data = await response.json();
    if (!data.items?.[0]) {
      throw new Error('チャンネルが見つかりませんでした');
    }

    return {
      title: data.items[0].snippet.title,
      description: data.items[0].snippet.description,
      thumbnails: data.items[0].snippet.thumbnails,
    };
  } catch (error) {
    console.error('YouTube API Error:', error);
    throw error;
  }
}
