import {
  faCheckDouble,
  faExclamationTriangle,
  faQuestionCircle,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import { useForm } from '../../../helpers';
import { ButtonComponent } from '../button';
import {
  InputCheckboxComponent,
  inputCheckboxProps,
  InputComponent,
  InputCurrencyComponent,
  InputDateComponent,
  inputDateProps,
  InputFileComponent,
  inputFileProps,
  inputImageProps,
  InputMapComponent,
  inputMapProps,
  InputNumberComponent,
  inputNumberProps,
  inputProps,
  InputRadioComponent,
  inputRadioProps,
  InputTimeComponent,
  inputTimeProps,
  SelectComponent,
  selectProps,
} from '../input';
import InputImageComponent from '../input/InputImage.component';
import { ModalConfirmComponent } from '../modal';
import { formSupervisionProps } from './form-supervision.props';
import { textaeraProps } from '../input/props/textarea.props';
import { TextareaComponent } from '../input/Textarea.component';

export function FormSupervisionComponent({
  title,
  forms,
  submitControl,
  confirmation,
  defaultValue,
  onSuccess,
  onError,
  customActionBar,
}: formSupervisionProps) {
  const [modalFailed, setModalFailed] = useState<boolean>(false);
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
  const [fresh, setFresh] = useState<boolean>(true);

  const success = (data: any) => {
    onSuccess?.(data);
    setModalSuccess(true);
    setFresh(false);
    setTimeout(() => {
      setFresh(true);
    }, 500);
  };

  const onFailed = (code: number) => {
    onError?.(code);

    if (code == 422) {
      confirm.onClose();
    } else {
      setModalFailed(true);
    }
  };

  const [
    {
      formControl,
      values,
      setValues,
      errors,
      setErrors,
      setDefaultValues,
      registers,
      setRegisters,
      submit,
      loading,
      confirm,
    },
  ] = useForm(submitControl, confirmation, success, onFailed);

  useEffect(() => {
    if (defaultValue) {
      setDefaultValues(defaultValue);
    } else {
      setDefaultValues({});
      setFresh(false);
      setTimeout(() => {
        setFresh(true);
      }, 500);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  useEffect(() => {
    setFresh(false);
    setTimeout(() => {
      setFresh(true);
    }, 500);
  }, [forms]);

  return (
    <>
      {title && <h4 className="text-lg font-semibold mb-4">{title}</h4>}

      <form className="grid grid-cols-12 gap-3" onSubmit={submit}>
        {fresh &&
          forms.map((form, key) => {
            const inputType = form.type || 'default';
            return (
              <React.Fragment key={key}>
                <div
                  style={{
                    gridColumn: `span ${form?.col ? form.col : '12'} / span ${
                      form?.col ? form.col : '12'
                    }`,
                  }}
                >
                  {inputType == 'custom' ? (
                    <>
                      {form.custom?.({
                        formControl,
                        values,
                        setValues,
                        registers,
                        setRegisters,
                        errors,
                        setErrors,
                      })}
                    </>
                  ) : inputType == 'select' ? (
                    <SelectComponent
                      {...(form.construction as selectProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                      autoFocus={key == 0}
                    />
                  ) : inputType == 'date' ? (
                    <InputDateComponent
                      {...(form.construction as inputDateProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                      autoFocus={key == 0}
                    />
                  ) : inputType == 'file' ? (
                    <InputFileComponent
                      {...(form.construction as inputFileProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                    />
                  ) : inputType == 'image' ? (
                    <InputImageComponent
                      {...(form.construction as inputImageProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                    />
                  ) : inputType == 'time' ? (
                    <InputTimeComponent
                      {...(form.construction as inputTimeProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                      autoFocus={key == 0}
                    />
                  ) : inputType == 'number' ? (
                    <InputNumberComponent
                      {...(form.construction as inputNumberProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                      autoFocus={key == 0}
                    />
                  ) : inputType == 'currency' ? (
                    <InputCurrencyComponent
                      {...(form.construction as inputNumberProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                      autoFocus={key == 0}
                    />
                  ) : inputType == 'check' ? (
                    <InputCheckboxComponent
                      {...(form.construction as inputCheckboxProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                    />
                  ) : inputType == 'radio' ? (
                    <InputRadioComponent
                      {...(form.construction as inputRadioProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                    />
                  ) : inputType == 'map' ? (
                    <InputMapComponent
                      {...(form.construction as inputMapProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                    />
                  ) : inputType == 'textarea' ? (
                    <TextareaComponent
                      {...(form.construction as textaeraProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                    />
                  ) : (
                    <InputComponent
                      {...(form.construction as inputProps)}
                      {...formControl(form.construction?.name || 'input_name')}
                      autoFocus={key == 0}
                    />
                  )}
                </div>

                {/* {(form.construction as inputProps)?.type == 'password' &&
                  form.passwordConfirmation && (
                    <div
                      style={{
                        gridColumn: `span ${
                          form?.col ? form.col : '12'
                        } / span ${form?.col ? form.col : '12'}`,
                      }}
                    >
                      <InputComponent
                        {...(form.construction as inputProps)}
                        {...formControl(form.construction?.name + '_confirm')}
                        name={form.construction?.name + '_confirm'}
                        onChange={(e) => {
                          if (
                            formControl(form.construction?.name || 'input_name')
                              .value != e
                          ) {
                            setPasswordConfirmationErrors([
                              ...passwordConfirmationErrors.filter(
                                (err) =>
                                  err.name !=
                                  form.construction?.name + '_confirm'
                              ),
                              {
                                name: form.construction?.name + '_confirm',
                                error: 'Konfirmasi tidak valid!',
                              },
                            ]);
                          }
                          formControl(
                            form.construction?.name + '_confirm'
                          ).onChange(e);
                        }}
                        error={
                          Array()
                            .concat(passwordConfirmationErrors)
                            ?.find(
                              (err) =>
                                err.name == form.construction?.name + '_confirm'
                            )?.error
                        }
                      />
                    </div>
                  )} */}
              </React.Fragment>
            );
          })}

        <div className="col-span-12">
          {customActionBar ? (
            customActionBar
          ) : (
            <>
              <div className="flex justify-end mt-4">
                <ButtonComponent
                  type="submit"
                  label="Simpan"
                  icon={faSave}
                  loading={loading}
                />
              </div>
            </>
          )}
        </div>
      </form>

      <ModalConfirmComponent
        show={modalSuccess}
        onClose={() => setModalSuccess(false)}
        paint="success"
        icon={faCheckDouble}
        title="Berhasil"
        tip="Data berhasil di simpan"
        submitButton={{
          label: 'Selesai',
        }}
        onSubmit={() => setModalSuccess(false)}
      />

      <ModalConfirmComponent
        show={modalFailed}
        onClose={() => setModalFailed(false)}
        paint="danger"
        icon={faExclamationTriangle}
        title="Gagal"
        tip="Data gagal di simpan, cek data dan koneksi internet dan coba kembali!"
        submitButton={{
          label: 'Oke, Mengerti',
        }}
        onSubmit={() => setModalFailed(false)}
      />

      <ModalConfirmComponent
        show={confirm.show}
        onClose={() => confirm.onClose()}
        paint="warning"
        icon={faQuestionCircle}
        title="Yakin"
        tip="Apakah data yang di masukkan sudah benar?"
        onSubmit={() => confirm.onConfirm()}
        submitButton={{
          label: 'Ya',
          loading: loading,
        }}
      />
    </>
  );
}
