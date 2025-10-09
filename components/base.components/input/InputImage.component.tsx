import { useEffect, useRef, useState } from 'react';
import { faCamera, faHandHolding } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import AvatarEditor from 'react-avatar-editor';
import { inputImageProps } from './props/input-image.props';
import styles from './input.module.css';
import { validationLangs } from '../../../langs';
import { inputLabel } from './input.decorate';
import { useValidationHelper } from '../../../helpers';

export function InputImageComponent({
  name,
  label,
  onChange,
  value,
  disabled,
  // placeholder,
  aspect,
  error,
  uploadUrl,
  validations,
  register,
}: // uploadFolder,
// crop,
// cropSize,
inputImageProps) {
  const [inputValue, setInputValue] = useState<string | File>('');
  const [isInvalid, setIsInvalid] = useState('');
  const [dragActive, setDragActive] = useState(false);
  // const [imageCrop, setImageCrop] = useState(false);

  useEffect(() => {
    register?.(name, validations);
  }, [register, name, validations]);

  const inputRef = useRef<HTMLInputElement>(null);

  const [errorMessage] = useValidationHelper({
    value: inputValue,
    rules: validations,
  });

  useEffect(() => {
    if (value) {
      // if (onChange && !uploadUrl) {
      setInputValue(
        (typeof value == 'object' ? URL.createObjectURL(value) : value) || ''
      );
      // } else {
      //   setInputValue(STORAGE_URL + '/' + value);
      // }
    } else {
      setInputValue('');
    }
  }, [value]);

  // =========================>
  // ## invalid handler
  // =========================>
  useEffect(() => {
    setIsInvalid(errorMessage || error || '');
  }, [error, errorMessage]);

  const upload = async (e: any) => {
    var image = e.target.files[0];

    const allowedExtension = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/svg',
    ];

    if (image?.size / 1024 > 1000) {
      alert('Anda memilih gambar dengan ukuran lebih dari 1 Mb!');
    }

    if (image && !allowedExtension.includes(image.type)) {
      setIsInvalid(
        validationLangs.extensionNotAllowed.replace(
          '@extension',
          'png/jpg/jpeg/svg'
        )
      );
    } else {
      !uploadUrl && setInputValue(image ? URL.createObjectURL(image) : '');

      if (onChange && !uploadUrl) {
        onChange(e.target.files[0]);
      }
    }

    // if (crop) {
    //   setImageCrop(image);
    // } else {

    // if (onChange && uploadUrl) {
    //   const formData = new FormData();

    //   formData.append('file_image', e.target.files[0]);

    //   if (uploadFolder) {
    //     formData.append('folder_name', uploadFolder);
    //   }

    //   const upload = await post('admin/hotel/upload-image', formData);

    //   if (upload?.status == 200) {
    //     onChange(upload.data.file_name);
    //     setImage(STORAGE_URL + '/' + upload.data.file_name);
    //   }
    // }
    // }
  };

  // handle drag events
  const handleDrag = function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // triggers when file is dropped
  const handleDrop = function (e: any) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && inputRef.current) {
      inputRef.current.files = e.dataTransfer.files;

      let image = e.dataTransfer.files[0];

      if (!uploadUrl) {
        setInputValue(image ? URL.createObjectURL(image) : '');
      }
    }
  };

  // const [zoom, setZoom] = useState('1');
  // const imageRef = useRef();

  // const onCropDown = () => {
  //   if (imageRef.current) {
  //     // This returns a HTMLCanvasElement, it can be made into a data URL or a blob,
  //     // drawn on another canvas, or added to the DOM.
  //     const canvas = imageRef.current.getImage().toDataURL();
  //     setImage(canvas);
  //     setImageCrop(false);

  //     onChange && onChange(dataURLtoFile(canvas, name));

  //     // If you want the image resized to the canvas size (also a HTMLCanvasElement)
  //     const canvasScaled = imageRef.current.getImageScaledToCanvas();
  //   }
  // };

  // useEffect(() => {
  //   setZoom(1);
  //   if (!imageCrop) {
  //     inputRef.current.value = null;
  //   }
  // }, [imageCrop]);

  // function dataURLtoFile(dataurl, filename) {
  //   var arr = dataurl.split(','),
  //     mime = arr[0].match(/:(.*?);/)[1],
  //     bstr = atob(arr[1]),
  //     n = bstr.length,
  //     u8arr = new Uint8Array(n);

  //   while (n--) {
  //     u8arr[n] = bstr.charCodeAt(n);
  //   }

  //   return new File([u8arr], filename, { type: mime });
  // }

  return (
    <>
      <div className="relative">
        <label htmlFor={name} className="cursor-pointer">
          <label
            htmlFor={`input_${name}`}
            className={`
            select-none
            ${inputLabel['md']}
            ${disabled && 'opacity-60'}
          `}
          >
            {label}
          </label>
          <div
            // htmlFor={name}
            style={{
              backgroundImage: 'url(' + inputValue + ')',
              filter: inputValue ? 'brightness(0.9)' : '',
              aspectRatio: aspect || '1/1',
            }}
            className={`
              bg-background text-slate-400 w-full border-[1px] shadow-inner relative flex flex-col gap-y-5 justify-center items-center m-auto rounded-lg bg-cover bg-no-repeat
              ${dragActive ? 'border-primary' : 'border-emerald-100'}   
              ${!disabled && 'cursor-pointer '} 
              ${isInvalid && 'outline__danger'}
            `}
            onDragEnter={handleDrag}
          >
            {!disabled &&
              (inputValue ? (
                <FontAwesomeIcon className="text-3xl" icon={faCamera} />
              ) : (
                <>
                  <FontAwesomeIcon
                    className="text-2xl"
                    icon={dragActive ? faHandHolding : faCamera}
                  />
                  <p className="text-sm">
                    {dragActive ? 'Letakkan disini' : 'Pilih gambar'}
                  </p>
                </>
              ))}
          </div>
          {/* {!ImageValid && (
              <div className='text__danger mt-3'>
                Image Extension Only (.jpg, .jpeg, .png, .svg)
              </div>
            )} */}
          <input
            ref={inputRef}
            type="file"
            id={name}
            name={name}
            onChange={upload}
            className="hidden"
            disabled={disabled}
            accept="image/*"
          />

          {dragActive && (
            <div
              className="absolute w-full h-full top-0 left-0"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            ></div>
          )}
        </label>

        {isInvalid && (
          <small
            className={`
              overflow-x-hidden
              ${styles.input__error__message}
              text-sm
            `}
          >
            {isInvalid}
          </small>
        )}
      </div>

      {/* <ModalComponent
        onClose={() => setImageCrop(false)}
        show={imageCrop}
        title={'Sesuaikan ukuran gambar'}
        footer={(
          <div className='flex justify-end'>
            <ButtonComponent
              icon={faSave}
              label={"Simpan"}
              bg="primary"
              color={"background"}
              size="sm"
              onClick={() => onCropDown()}
            />
          </div>
        )}
      >
        <div className='flex justify-center'>
          <div onWheel={(e) => e.deltaY < 0 ? setZoom(zoom + 0.01) : (zoom > 1) && setZoom(zoom - 0.01)}>
            <AvatarEditor
              ref={imageRef}
              image={imageCrop}
              width={cropSize?.at(0) ? cropSize[0] : 200}
              height={cropSize?.at(1) ? cropSize[1] : 200}
              // border={20}
              border={[20, 20]}
              color={[34, 40, 49, 0.5]} // RGBA
              scale={+zoom}
              rotate={0}
              borderRadius={0}
            />
          </div>
        </div>
      </ModalComponent> */}
    </>
  );
}

export default InputImageComponent;
