'use client';

import { useState } from 'react';
import { DatasetEntry, SearchResult, TrajectoryStep } from '@/lib/types';

export default function Home() {
  const [domain, setDomain] = useState('영화');
  const [keyword, setKeyword] = useState('기생충');
  const [dataset, setDataset] = useState<DatasetEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleGenerateQuestion = async () => {
    setLoading(true);
    setStatus('질문 생성 중...');

    try {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain, keyword }),
      });

      if (!res.ok) {
        throw new Error(`질문 생성 API 오류: ${res.status}`);
      }

      const data = await res.json();

      setDataset({
        id: crypto.randomUUID(),
        question: data.question,
        ground_truth: data.ground_truth,
        trajectory: [],
      });

      setStatus('질문 생성 완료. 궤적 생성을 시작하세요.');
    } catch (error) {
      console.error(error);
      setStatus('질문 생성에 실패했습니다. API 상태를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTrajectory = async () => {
    if (!dataset) {
      return;
    }

    setLoading(true);
    setStatus('궤적 생성 준비 중...');

    let currentTrajectory = [...dataset.trajectory];
    let isFinished = false;

    try {
      while (!isFinished && currentTrajectory.length < 20) {
        setStatus(`${currentTrajectory.length + 1}단계 생성 중...`);

        const res = await fetch('/api/next-step', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: dataset.question,
            trajectory: currentTrajectory,
          }),
        });

        if (!res.ok) {
          throw new Error(`다음 단계 생성 API 오류: ${res.status}`);
        }

        const nextStep: TrajectoryStep = await res.json();
        currentTrajectory = [...currentTrajectory, nextStep];

        setDataset((prev) =>
          prev
            ? {
                ...prev,
                trajectory: currentTrajectory,
              }
            : null,
        );

        if (nextStep.action.name === 'extract') {
          isFinished = true;
          setStatus('완료되었습니다!');
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (!isFinished && currentTrajectory.length >= 20) {
        setStatus('안전 제한(20단계)에 도달해 종료했습니다.');
      }
    } catch (error) {
      console.error(error);
      setStatus('궤적 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!dataset) {
      return;
    }

    const blob = new Blob([JSON.stringify(dataset, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `trajectory_${dataset.ground_truth}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-10">
      <h1 className="text-2xl font-bold">Web Search Trajectory Generator</h1>

      <div className="flex flex-col gap-3 rounded border bg-gray-50 p-4 md:flex-row">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="분야 (예: 과학)"
          className="rounded border p-2"
        />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="정답 키워드 (예: 양자컴퓨터)"
          className="rounded border p-2"
        />
        <button
          onClick={handleGenerateQuestion}
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
        >
          질문 생성
        </button>
      </div>

      {dataset && (
        <div className="rounded border bg-white p-6 shadow">
          <h2 className="mb-2 text-lg font-bold">Q: {dataset.question}</h2>
          <p className="text-sm text-gray-500">Target Answer: {dataset.ground_truth}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleGenerateTrajectory}
              disabled={loading || dataset.trajectory.length > 0}
              className="rounded bg-green-600 px-4 py-2 text-white disabled:bg-gray-400"
            >
              🚀 궤적 생성 시작
            </button>
            <button
              onClick={downloadJson}
              disabled={!dataset}
              className="rounded bg-gray-800 px-4 py-2 text-white disabled:bg-gray-400"
            >
              📥 JSON 다운로드
            </button>
          </div>
        </div>
      )}

      {status && <div className="animate-pulse font-medium text-blue-600">{status}</div>}

      <div className="space-y-4">
        {dataset?.trajectory.map((step) => (
          <div key={step.step} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-2 flex justify-between">
              <span className="font-bold text-indigo-600">Step {step.step}</span>
              <span className="rounded bg-gray-200 px-2 py-1 text-xs font-bold uppercase">
                {step.action.name}
              </span>
            </div>

            <div className="text-sm text-gray-700">
              {step.action.name === 'think' && (
                <p className="italic">&quot; {step.action.arguments.query} &quot;</p>
              )}

              {step.action.name === 'search' && (
                <div>
                  <p className="font-semibold">Query: {step.action.arguments.query}</p>
                  <div className="mt-2 rounded bg-gray-50 p-2 text-xs">
                    {step.action.arguments.result?.slice(0, 2).map((r: SearchResult, i: number) => (
                      <div key={i} className="mb-1 border-b pb-1">
                        <span className="text-blue-500">{r.title}</span>
                        <p className="truncate text-gray-500">{r.snippet}</p>
                      </div>
                    ))}
                    <p>... (Total {step.action.arguments.result?.length ?? 0} results)</p>
                  </div>
                </div>
              )}

              {step.action.name === 'browse' && (
                <div>
                  <p className="text-blue-500 underline">{step.action.arguments.url}</p>
                  <p className="mt-1 font-bold">Signal: {step.action.arguments.signal}</p>
                </div>
              )}

              {step.action.name === 'extract' && (
                <div className="rounded border border-green-200 bg-green-50 p-2">
                  <p>
                    Answer:{' '}
                    <span className="text-lg font-bold">{step.action.arguments.answer}</span>
                  </p>
                  <p>{step.action.arguments.explanation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
