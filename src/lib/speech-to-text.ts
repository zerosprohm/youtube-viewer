'use server';

import { SpeechClient } from '@google-cloud/speech';
import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Google Cloud Speech-to-Text APIの認証情報
const speechClient = new SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  // または、環境変数で直接APIキーを設定する場合
  // credentials: {
  //   client_email: process.env.GOOGLE_CLIENT_EMAIL,
  //   private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  // },
});

// Google Cloud Speech-to-Text APIの実際の型を使用
type ISpeechRecognitionResult = import('@google-cloud/speech').protos.google.cloud.speech.v1.ISpeechRecognitionResult;

// 認証情報のチェック
function checkGoogleCloudCredentials() {
  console.log('Google Cloud認証情報チェック:');
  console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? '設定済み' : '未設定');
  console.log('- GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? '設定済み' : '未設定');
  console.log('- GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '設定済み' : '未設定');
}

// バッファを一時ファイルに保存
async function saveBufferToTempFile(buffer: Buffer, prefix: string, extension: string = '.webm'): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp');
  
  // tempディレクトリが存在しない場合は作成
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${extension}`;
  const filePath = path.join(tempDir, fileName);
  
  await fs.promises.writeFile(filePath, buffer);
  console.log(`一時ファイル保存: ${filePath}`);
  
  return filePath;
}

// 一時ファイルを削除
async function deleteTempFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
    console.log(`一時ファイル削除: ${filePath}`);
  } catch (error) {
    console.warn(`一時ファイル削除失敗: ${filePath}`, error);
  }
}

// ffmpegで音声を分割
async function splitAudioWithFFmpeg(inputFilePath: string, segmentDuration: number = 30): Promise<string[]> {
  const inputDir = path.dirname(inputFilePath);
  const inputFileName = path.basename(inputFilePath, path.extname(inputFilePath));
  const outputPattern = path.join(inputDir, `${inputFileName}_segment_%03d.webm`);
  
  console.log(`ffmpegで音声分割開始: ${inputFilePath} -> ${outputPattern}`);
  
  // ffmpegコマンドを実行
  const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -c copy -map 0 -segment_time ${segmentDuration} -f segment -reset_timestamps 1 "${outputPattern}"`;
  
  try {
    const { stderr } = await execAsync(ffmpegCommand);
    console.log('ffmpeg実行完了');
    if (stderr) {
      console.log('ffmpeg stderr:', stderr);
    }
  } catch (error) {
    console.error('ffmpeg実行エラー:', error);
    throw new Error(`音声分割に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
  
  // 生成されたセグメントファイルのパスを取得
  const segmentFiles: string[] = [];
  let segmentIndex = 0;
  
  while (true) {
    const segmentPath = path.join(inputDir, `${inputFileName}_segment_${segmentIndex.toString().padStart(3, '0')}.webm`);
    if (fs.existsSync(segmentPath)) {
      segmentFiles.push(segmentPath);
      segmentIndex++;
    } else {
      break;
    }
  }
  
  console.log(`音声分割完了: ${segmentFiles.length} セグメント`);
  return segmentFiles;
}

// ファイルをバッファとして読み込み
async function readFileAsBuffer(filePath: string): Promise<Buffer> {
  return await fs.promises.readFile(filePath);
}

// 単一セグメントの文字起こし
async function transcribeSegment(audioBuffer: Buffer, languageCode: string, segmentIndex: number): Promise<string> {
  try {
    console.log(`セグメント ${segmentIndex + 1} の文字起こし開始: ${audioBuffer.length} bytes`);
    
    const audioContent = audioBuffer.toString('base64');
    
    const request = {
      audio: {
        content: audioContent,
      },
      config: {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: false,
        model: 'latest_long',
        audioChannelCount: 2,
        useEnhanced: true,
      },
    };

    console.log(`セグメント ${segmentIndex + 1} Speech-to-Text APIリクエスト送信中...`);
    
    const [response] = await speechClient.recognize(request);
    const results = response.results;
    
    if (!results || results.length === 0) {
      console.log(`セグメント ${segmentIndex + 1} の文字起こし結果が空です`);
      return '';
    }

    const transcription = results
      .map((result: ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(' ');

    console.log(`セグメント ${segmentIndex + 1} 文字起こし完了: ${transcription.length} 文字`);
    return transcription;
  } catch (error) {
    console.error(`セグメント ${segmentIndex + 1} 文字起こしエラー:`, error);
    
    // 音声チャンネル数の問題がある場合は、設定を調整して再試行
    if (error instanceof Error && error.message.includes('audio_channel_count')) {
      console.log(`セグメント ${segmentIndex + 1} 音声チャンネル数の問題を検出。設定を調整して再試行...`);
      
      const retryRequest = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'WEBM_OPUS' as const,
          sampleRateHertz: 48000,
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
          model: 'latest_long',
          useEnhanced: true,
          // audioChannelCountを指定しない（自動検出に任せる）
        },
      };
      
      try {
        const [response] = await speechClient.recognize(retryRequest);
        const results = response.results;
        
        if (!results || results.length === 0) {
          return '';
        }
        
        const transcription = results
          .map((result: ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript)
          .filter(Boolean)
          .join(' ');
        
        console.log(`セグメント ${segmentIndex + 1} 再試行成功: ${transcription.length} 文字`);
        return transcription;
      } catch (retryError) {
        console.error(`セグメント ${segmentIndex + 1} 再試行も失敗:`, retryError);
        return ''; // エラーの場合は空文字を返す
      }
    }
    
    return ''; // エラーの場合は空文字を返す
  }
}

export async function downloadAudioFromYouTube(videoId: string): Promise<Buffer> {
  try {
    console.log('ytdl-coreで音声ダウンロード開始:', videoId);
    
    const audioStream = ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
      filter: 'audioonly',
      quality: 'highestaudio',
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });

    console.log('ytdl-coreストリーム作成成功');

    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      audioStream.on('data', (chunk) => {
        chunks.push(chunk);
        console.log('音声データチャンク受信:', chunk.length, 'bytes');
      });
      
      audioStream.on('end', () => {
        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        console.log('音声ダウンロード完了。総サイズ:', totalSize, 'bytes');
        resolve(Buffer.concat(chunks));
      });
      
      audioStream.on('error', (error) => {
        console.error('ytdl-coreストリームエラー:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('Audio download error:', error);
    throw new Error(`音声ファイルのダウンロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

export async function transcribeAudio(audioBuffer: Buffer, languageCode: string = 'ja-JP') {
  let tempAudioFile: string | null = null;
  let segmentFiles: string[] = [];
  
  try {
    console.log(`transcribeAudio開始: ${languageCode}, バッファサイズ: ${audioBuffer.length} bytes`);
    
    // 音声バッファを一時ファイルに保存
    tempAudioFile = await saveBufferToTempFile(audioBuffer, 'audio');
    
    // ffmpegで音声を30秒ごとに分割
    segmentFiles = await splitAudioWithFFmpeg(tempAudioFile, 30);
    
    if (segmentFiles.length === 0) {
      throw new Error('音声分割に失敗しました');
    }
    
    console.log(`${segmentFiles.length} セグメントの文字起こしを開始...`);
    
    // 各セグメントをバッファとして読み込み、文字起こしを並行処理
    const segmentPromises = segmentFiles.map(async (segmentFile, index) => {
      const segmentBuffer = await readFileAsBuffer(segmentFile);
      return transcribeSegment(segmentBuffer, languageCode, index);
    });
    
    const results = await Promise.all(segmentPromises);
    
    // 結果を結合
    const transcription = results.join(' ');
    
    console.log(`文字起こし完了: ${transcription.length} 文字`);
    
    return {
      text: transcription,
      confidence: 1.0, // セグメントごとの信頼度を平均化する必要がある場合は後で実装
      languageCode,
    };
  } catch (error) {
    console.error('Transcription error:', error);
    console.error('Speech-to-Text APIエラーの詳細:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    throw new Error(`文字起こしに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  } finally {
    // 一時ファイルを削除
    if (tempAudioFile) {
      await deleteTempFile(tempAudioFile);
    }
    
    for (const segmentFile of segmentFiles) {
      await deleteTempFile(segmentFile);
    }
  }
}

export async function getVideoTranscription(videoId: string) {
  try {
    console.log('getVideoTranscription開始:', videoId);
    
    // 認証情報をチェック
    checkGoogleCloudCredentials();
    
    // 音声ファイルをダウンロード
    console.log('音声ファイルをダウンロード中...');
    const audioBuffer = await downloadAudioFromYouTube(videoId);
    console.log('音声ダウンロード完了。バッファサイズ:', audioBuffer.length, 'bytes');
    
    // 日本語で文字起こしを試行
    console.log('日本語で文字起こし中...');
    let transcription = await transcribeAudio(audioBuffer, 'ja-JP');
    console.log('日本語文字起こし結果:', transcription.text.length, '文字');
    
    // 日本語の文字起こしが短すぎる場合は英語も試行
    if (transcription.text.length < 50) {
      console.log('英語で文字起こしを試行中...');
      const englishTranscription = await transcribeAudio(audioBuffer, 'en-US');
      console.log('英語文字起こし結果:', englishTranscription.text.length, '文字');
      
      // より長い結果を選択
      if (englishTranscription.text.length > transcription.text.length) {
        transcription = englishTranscription;
        console.log('英語の結果を採用');
      } else {
        console.log('日本語の結果を採用');
      }
    }
    
    console.log('最終文字起こし結果:', transcription.text.length, '文字');
    return {
      text: transcription.text,
      confidence: transcription.confidence,
      languageCode: transcription.languageCode,
      method: 'speech-to-text',
    };
  } catch (error) {
    console.error('Video transcription error:', error);
    console.error('エラーの詳細:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw error;
  }
} 