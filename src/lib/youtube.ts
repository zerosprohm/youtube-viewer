'use server';

import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';

const API_KEY = process.env.YOUTUBE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function getChannelVideos(channelId: string, pageToken?: string) {
  console.log('channelId', channelId);
  if (!API_KEY) {
    throw new Error('YouTube APIキーが設定されていません');
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
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

    // 動画の詳細情報（長さを含む）を取得
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
    );

    if (!videoDetailsResponse.ok) {
      const error = await videoDetailsResponse.json();
      console.error('Video Details API Error Response:', error);
      throw new Error(error.error?.message || '動画の詳細情報の取得に失敗しました');
    }

    const videoDetails = await videoDetailsResponse.json();
    const videoDetailsMap = new Map(
      videoDetails.items.map((item: any) => [item.id, item.contentDetails])
    );

    // 動画情報と詳細情報を結合
    const videos = data.items.map((item: any) => ({
      ...item,
      contentDetails: videoDetailsMap.get(item.id.videoId),
    }));

    return {
      videos,
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

export async function getVideoCaptions(videoId: string) {
  if (!API_KEY) {
    throw new Error('YouTube APIキーが設定されていません');
  }

  try {
    // 字幕トラックの一覧を取得
    const params = new URLSearchParams({
      key: API_KEY,
      part: 'snippet',
      videoId,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('YouTube Captions API Error Response:', error);
      throw new Error(error.error?.message || '字幕の取得に失敗しました');
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null; // 字幕が存在しない
    }

    // 日本語の字幕を優先、次に英語、最後に最初の字幕
    let targetCaption = data.items[0];
    
    for (const caption of data.items) {
      if (caption.snippet.language === 'ja') {
        targetCaption = caption;
        break;
      } else if (caption.snippet.language === 'en' && targetCaption.snippet.language !== 'ja') {
        targetCaption = caption;
      }
    }

    // 字幕の内容を取得（YouTube APIでは直接字幕内容を取得できないため、
    // 字幕が存在するかどうかの確認のみ行う）
    return {
      captionId: targetCaption.id,
      language: targetCaption.snippet.language,
      name: targetCaption.snippet.name,
      trackKind: targetCaption.snippet.trackKind,
    };
  } catch (error) {
    console.error('YouTube Captions API Error:', error);
    throw error;
  }
}

export async function getVideoTranscript(videoId: string) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return null;
    }

    // 字幕をテキストに結合
    const text = transcript
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      text,
      language: transcript[0]?.lang || 'unknown',
      duration: transcript[transcript.length - 1]?.offset + transcript[transcript.length - 1]?.duration || 0,
    };
  } catch (error) {
    console.error('Transcript fetch error:', error);
    return null;
  }
}

export async function summarizeVideo(videoId: string, durationInSeconds?: number) {
  try {
    // 動画の長さを取得（外部から渡されていない場合のみ）
    let videoDuration = durationInSeconds;
    if (videoDuration === undefined) {
      videoDuration = await getVideoDuration(videoId);
    }
    console.log('動画の長さ:', videoDuration, '秒');
    
    // まず字幕を取得してみる
    let transcript = await getVideoTranscript(videoId);
    let method = 'caption';
    
    // 字幕がない場合は音声から文字起こし
    if (!transcript) {
      console.log('字幕が見つかりません。音声から文字起こしを試行します...');
      try {
        const { getVideoTranscription } = await import('./speech-to-text');
        console.log('speech-to-textモジュールのインポート成功');
        const speechResult = await getVideoTranscription(videoId);
        console.log('音声文字起こし成功:', speechResult);
        
        transcript = {
          text: speechResult.text,
          language: speechResult.languageCode,
          duration: videoDuration, // 動画の実際の長さを使用
        };
        method = 'speech-to-text';
      } catch (speechError) {
        console.error('音声文字起こしエラーの詳細:', speechError);
        throw new Error(`音声文字起こしに失敗しました: ${speechError instanceof Error ? speechError.message : '不明なエラー'}`);
      }
    } else {
      // 字幕がある場合も動画の実際の長さを使用
      transcript.duration = videoDuration;
    }

    if (!transcript || transcript.text.length === 0) {
      throw new Error('字幕または音声の文字起こしができませんでした');
    }

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI APIキーが設定されていません');
    }

    // OpenAIで要約
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは動画の内容を簡潔に要約する専門家です。以下の字幕を読み、動画の主要なポイントを箇条書きで要約してください。"
        },
        {
          role: "user",
          content: `以下の動画の字幕を要約してください：\n\n${transcript.text}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const summary = completion.choices[0]?.message?.content || '要約の生成に失敗しました';

    return {
      summary,
      originalText: transcript.text,
      language: transcript.language,
      duration: transcript.duration,
      method, // 字幕または音声から文字起こしのどちらを使用したかを記録
    };
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}

export async function getVideoDuration(videoId: string): Promise<number> {
  if (!API_KEY) {
    throw new Error('YouTube APIキーが設定されていません');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${API_KEY}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Video Duration API Error Response:', error);
      throw new Error(error.error?.message || '動画の長さの取得に失敗しました');
    }

    const data = await response.json();
    if (!data.items?.[0]?.contentDetails?.duration) {
      throw new Error('動画の長さが見つかりませんでした');
    }

    // ISO 8601形式の期間を秒に変換
    const duration = data.items[0].contentDetails.duration;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    if (!match) {
      throw new Error('動画の長さの形式が無効です');
    }

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  } catch (error) {
    console.error('Video Duration Error:', error);
    throw error;
  }
}
