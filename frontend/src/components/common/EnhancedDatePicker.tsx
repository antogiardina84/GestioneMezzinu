// src/components/common/EnhancedDatePicker.tsx
import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';

interface EnhancedDatePickerProps {
  label: string;
  value: any;
  onChange: (newValue: any) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  format?: string;
  [x: string]: any;
}

const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  fullWidth = true,
  format = 'DD/MM/YYYY',
  ...props
}) => {
  return (
    <DatePicker
      label={label}
      value={value || null}
      onChange={onChange}
      disabled={disabled}
      format={format}
      slotProps={{
        textField: {
          fullWidth: fullWidth,
          error: error,
          helperText: helperText,
        },
        desktopPaper: {
          sx: {
            '& .MuiYearCalendar-root': {
              maxHeight: '300px',
              overflowY: 'auto',
            },
          },
        },
        actionBar: {
          actions: ['clear', 'today', 'accept', 'cancel'],
        },
        popper: {
          placement: 'bottom-start',
          modifiers: [
            {
              name: 'preventOverflow',
              options: {
                boundary: document.body,
              },
            },
            {
              name: 'offset',
              options: {
                offset: [0, 8],
              },
            },
          ],
        },
      }}
      reduceAnimations={true}
      {...props}
    />
  );
};

export default EnhancedDatePicker;
