import React, { useEffect, useState } from 'react';
import OtpInput from 'react-otp-input';

const InputOtpComponent = ({ onChange, error, max, value }) => {
  const [inputValue, setInputValue] = useState('');
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (onChange) {
      onChange(inputValue);
    }

    if (value) {
      setInvalid(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  useEffect(() => {
    if (error) {
      setInvalid(error);
    }
  }, [error]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="relative">
      <OtpInput
        value={inputValue}
        onChange={(e) => setInputValue(e)}
        numInputs={max}
        separator={' '}
        inputStyle={'input_otp'}
        containerStyle={'mt-2'}
        isInputNum={true}
        hasErrored={invalid}
        errorStyle={'border__danger'}
        placeholder="00000"
      />

      {invalid && (
        <small className="block -bottom-6 text-sm text-left text-danger absolute">
          {invalid}
        </small>
      )}
    </div>
  );
};

export default InputOtpComponent;
