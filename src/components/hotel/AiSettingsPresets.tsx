import { AiModelSettings } from './types';

export interface AiPreset {
  id: string;
  name: string;
  description: string;
  settings: AiModelSettings;
}

export const AI_PRESETS: Record<string, AiPreset[]> = {
  yandexgpt: [
    {
      id: 'yandexgpt-concierge',
      name: 'Консьерж (рекомендуется)',
      description: 'Минимум галлюцинаций, строгие шаблоны',
      settings: {
        provider: 'yandex',
        model: 'yandexgpt',
        temperature: 0.15,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 600,
        system_priority: 'strict',
        creative_mode: 'off'
      }
    },
    {
      id: 'yandexgpt-creative',
      name: 'Креативный',
      description: 'Более живые и разнообразные ответы',
      settings: {
        provider: 'yandex',
        model: 'yandexgpt',
        temperature: 0.4,
        top_p: 0.95,
        frequency_penalty: 0.3,
        presence_penalty: 0.2,
        max_tokens: 800,
        system_priority: 'normal',
        creative_mode: 'on'
      }
    }
  ],
  'yandexgpt-lite': [
    {
      id: 'yandexgpt-lite-fast',
      name: 'Быстрый',
      description: 'Облегченная модель для быстрых ответов',
      settings: {
        provider: 'yandex',
        model: 'yandexgpt-lite',
        temperature: 0.2,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 500
      }
    }
  ],
  'llama-3.1-8b': [
    {
      id: 'llama-precise',
      name: 'Точный',
      description: 'Минимум вариативности',
      settings: {
        provider: 'openrouter',
        model: 'llama-3.1-8b',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 600
      }
    }
  ],
  'gemma-2-9b': [
    {
      id: 'gemma-precise',
      name: 'Точный',
      description: 'Минимум вариативности',
      settings: {
        provider: 'openrouter',
        model: 'gemma-2-9b',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 600
      }
    }
  ],
  'qwen-2.5-7b': [
    {
      id: 'qwen-precise',
      name: 'Точный',
      description: 'Минимум вариативности',
      settings: {
        provider: 'openrouter',
        model: 'qwen-2.5-7b',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 600
      }
    }
  ],
  'phi-3-medium': [
    {
      id: 'phi-precise',
      name: 'Точный',
      description: 'Минимум вариативности',
      settings: {
        provider: 'openrouter',
        model: 'phi-3-medium',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 600
      }
    }
  ],
  'deepseek-r1': [
    {
      id: 'deepseek-precise',
      name: 'Точный',
      description: 'Минимум вариативности',
      settings: {
        provider: 'openrouter',
        model: 'deepseek-r1',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 600
      }
    }
  ],
  'gpt-4o': [
    {
      id: 'gpt4o-balanced',
      name: 'Сбалансированный',
      description: 'Оптимальные параметры для GPT-4o',
      settings: {
        provider: 'openrouter',
        model: 'gpt-4o',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 800
      }
    }
  ],
  'claude-3.5-sonnet': [
    {
      id: 'claude35-balanced',
      name: 'Сбалансированный',
      description: 'Оптимальные параметры для Claude 3.5',
      settings: {
        provider: 'openrouter',
        model: 'claude-3.5-sonnet',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 800
      }
    }
  ],
  'gpt-3.5-turbo': [
    {
      id: 'gpt35-fast',
      name: 'Быстрый',
      description: 'Быстрые и дешевые ответы',
      settings: {
        provider: 'openrouter',
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        top_p: 1.0,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 600
      }
    }
  ]
};