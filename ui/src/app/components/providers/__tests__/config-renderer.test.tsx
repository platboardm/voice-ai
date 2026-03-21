/**
 * Component tests for ConfigRenderer.
 *
 * Tests that the generic UI renderer correctly renders fields based on
 * config.json parameter types and calls onParameterChange appropriately.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Metadata } from '@rapidaai/react';
import { ConfigRenderer } from '../config-renderer';
import { CategoryConfig } from '@/providers/config-loader';

jest.mock('@/utils', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}));

jest.mock('@/app/components/dropdown', () => {
  const React = require('react');
  return {
    Dropdown: ({ currentValue, setValue, allValue, placeholder }: any) =>
      React.createElement(
        'div',
        null,
        placeholder ? React.createElement('span', null, placeholder) : null,
        React.createElement(
          'select',
          {
            value:
              currentValue?.id ??
              currentValue?.code ??
              currentValue?.value ??
              currentValue?.model_id ??
              currentValue?.voice_id ??
              currentValue?.language_id ??
              '',
            onChange: (e: any) => {
              const selected = (allValue || []).find(
                (item: any) =>
                  item.id === e.target.value ||
                  item.code === e.target.value ||
                  item.value === e.target.value ||
                  item.model_id === e.target.value ||
                  item.voice_id === e.target.value ||
                  item.language_id === e.target.value,
              );
              if (selected) setValue(selected);
            },
          },
          React.createElement(
            'option',
            { value: '' },
            placeholder || 'Select option',
          ),
          ...(allValue || []).map((item: any) => {
            const value =
              item.id ??
              item.code ??
              item.value ??
              item.model_id ??
              item.voice_id ??
              item.language_id;
            const label = item.name ?? item.label ?? String(value);
            return React.createElement(
              'option',
              { key: String(value), value: String(value) },
              label,
            );
          }),
        ),
      ),
  };
});

// Mock the loadProviderData to return controlled test data
jest.mock('@/providers/config-loader', () => {
  const actual = jest.requireActual('@/providers/config-loader');
  return {
    ...actual,
    loadProviderData: (provider: string, filename: string) => {
      if (filename === 'models.json') {
        return [
          { id: 'model-a', name: 'Model A' },
          { id: 'model-b', name: 'Model B' },
        ];
      }
      if (filename === 'languages.json') {
        return [
          { code: 'en', name: 'English' },
          { code: 'fr', name: 'French' },
        ];
      }
      return [];
    },
  };
});

function createMetadata(key: string, value: string): Metadata {
  const m = new Metadata();
  m.setKey(key);
  m.setValue(value);
  return m;
}

describe('ConfigRenderer', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('dropdown fields', () => {
    const dropdownConfig: CategoryConfig = {
      preservePrefix: 'microphone.',
      parameters: [
        {
          key: 'listen.model',
          label: 'Model',
          type: 'dropdown',
          required: true,
          data: 'models.json',
          valueField: 'id',
        },
      ],
    };

    it('renders dropdown with label', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={dropdownConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Model')).toBeInTheDocument();
    });

    it('renders dropdown placeholder', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={dropdownConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getAllByText('Select model').length).toBeGreaterThan(0);
    });
  });

  describe('slider fields', () => {
    const sliderConfig: CategoryConfig = {
      parameters: [
        {
          key: 'listen.threshold',
          label: 'Threshold',
          type: 'slider',
          default: '0.5',
          min: 0.1,
          max: 0.9,
          step: 0.1,
          helpText: 'Set the confidence threshold.',
        },
      ],
    };

    it('renders slider with label and help text', () => {
      const params = [createMetadata('listen.threshold', '0.5')];
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={sliderConfig}
          parameters={params}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Threshold')).toBeInTheDocument();
      expect(screen.getByText('Set the confidence threshold.')).toBeInTheDocument();
    });

    it('renders number input alongside slider with current value', () => {
      const params = [createMetadata('listen.threshold', '0.5')];
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={sliderConfig}
          parameters={params}
          onParameterChange={mockOnChange}
        />,
      );

      const numberInput = screen.getByRole('spinbutton');
      expect(numberInput).toBeInTheDocument();
      expect(numberInput).toHaveAttribute('type', 'number');
    });

    it('calls onParameterChange when number input changes', () => {
      const params = [createMetadata('listen.threshold', '0.5')];
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={sliderConfig}
          parameters={params}
          onParameterChange={mockOnChange}
        />,
      );

      const numberInput = screen.getByRole('spinbutton');
      fireEvent.change(numberInput, { target: { value: '0.7' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);

      const updatedParams = mockOnChange.mock.calls[0][0] as Metadata[];
      const threshold = updatedParams.find(m => m.getKey() === 'listen.threshold');
      expect(threshold?.getValue()).toBe('0.7');
    });
  });

  describe('number fields', () => {
    const numberConfig: CategoryConfig = {
      parameters: [
        {
          key: 'model.max_tokens',
          label: 'Max Tokens',
          type: 'number',
          default: '2048',
          min: 1,
          placeholder: 'Enter max tokens',
        },
      ],
    };

    it('renders number input with label', () => {
      const params = [createMetadata('model.max_tokens', '2048')];
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={numberConfig}
          parameters={params}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Max Tokens')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2048')).toBeInTheDocument();
    });
  });

  describe('input fields', () => {
    const inputConfig: CategoryConfig = {
      parameters: [
        {
          key: 'model.endpoint',
          label: 'Endpoint URL',
          type: 'input',
          placeholder: 'Enter endpoint URL',
        },
      ],
    };

    it('renders text input with label and placeholder', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={inputConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Endpoint URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter endpoint URL')).toBeInTheDocument();
    });

    it('calls onParameterChange when input changes', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={inputConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      const input = screen.getByPlaceholderText('Enter endpoint URL');
      fireEvent.change(input, { target: { value: 'https://api.example.com' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);

      const updatedParams = mockOnChange.mock.calls[0][0] as Metadata[];
      const endpoint = updatedParams.find(m => m.getKey() === 'model.endpoint');
      expect(endpoint?.getValue()).toBe('https://api.example.com');
    });
  });

  describe('textarea fields', () => {
    const textareaConfig: CategoryConfig = {
      parameters: [
        {
          key: 'listen.keywords',
          label: 'Keywords',
          type: 'textarea',
          required: false,
          placeholder: 'Enter keywords',
          helpText: 'Separate keywords with spaces.',
          colSpan: 2,
        },
      ],
    };

    it('renders textarea with label, placeholder, and help text', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={textareaConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Keywords')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter keywords')).toBeInTheDocument();
      expect(screen.getByText('Separate keywords with spaces.')).toBeInTheDocument();
    });
  });

  describe('select fields', () => {
    const selectConfig: CategoryConfig = {
      parameters: [
        {
          key: 'model.reasoning_effort',
          label: 'Reasoning Effort',
          type: 'select',
          required: false,
          choices: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
          ],
        },
      ],
    };

    it('renders select with label and options', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={selectConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Reasoning Effort')).toBeInTheDocument();
    });

    it('calls onParameterChange on select change', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={selectConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'high' } });
      expect(mockOnChange).toHaveBeenCalledTimes(1);

      const updatedParams = mockOnChange.mock.calls[0][0] as Metadata[];
      const effort = updatedParams.find(m => m.getKey() === 'model.reasoning_effort');
      expect(effort?.getValue()).toBe('high');
    });
  });

  describe('json fields', () => {
    const jsonConfig: CategoryConfig = {
      parameters: [
        {
          key: 'model.response_format',
          label: 'Response Format',
          type: 'json',
          required: false,
        },
      ],
    };

    it('renders textarea with JSON placeholder', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={jsonConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Response Format')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter as JSON')).toBeInTheDocument();
    });
  });

  describe('showWhen conditional visibility', () => {
    const conditionalConfig: CategoryConfig = {
      parameters: [
        {
          key: 'model.id',
          label: 'Model',
          type: 'input',
          required: true,
        },
        {
          key: 'model.reasoning_effort',
          label: 'Reasoning Effort',
          type: 'select',
          required: false,
          choices: [
            { label: 'Low', value: 'low' },
            { label: 'High', value: 'high' },
          ],
          showWhen: { key: 'model.id', pattern: '^o' },
        },
      ],
    };

    it('hides field when showWhen condition not met', () => {
      const params = [createMetadata('model.id', 'gpt-4')];
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={conditionalConfig}
          parameters={params}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.queryByText('Reasoning Effort')).not.toBeInTheDocument();
    });

    it('shows field when showWhen condition is met', () => {
      const params = [createMetadata('model.id', 'o1-preview')];
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={conditionalConfig}
          parameters={params}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Model')).toBeInTheDocument();
      expect(screen.getByText('Reasoning Effort')).toBeInTheDocument();
    });
  });

  describe('advanced params (text category with popover)', () => {
    const advancedConfig: CategoryConfig = {
      parameters: [
        {
          key: 'model.id',
          label: 'Model',
          type: 'dropdown',
          required: true,
          data: 'models.json',
          valueField: 'id',
        },
        {
          key: 'model.temperature',
          label: 'Temperature',
          type: 'slider',
          default: '0.7',
          min: 0,
          max: 1,
          step: 0.1,
          advanced: true,
        },
      ],
    };

    it('renders the advanced toggle button for text category', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="text"
          config={advancedConfig}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      // Should render the bolt/x toggle button
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('empty/null parameters', () => {
    const config: CategoryConfig = {
      parameters: [
        {
          key: 'listen.model',
          label: 'Model',
          type: 'input',
          required: true,
        },
      ],
    };

    it('handles null parameters gracefully', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={config}
          parameters={null}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Model')).toBeInTheDocument();
    });

    it('handles empty parameters array', () => {
      render(
        <ConfigRenderer
          provider="test"
          category="stt"
          config={config}
          parameters={[]}
          onParameterChange={mockOnChange}
        />,
      );

      expect(screen.getByText('Model')).toBeInTheDocument();
    });
  });
});
