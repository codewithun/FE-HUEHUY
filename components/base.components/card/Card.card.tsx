import Image from 'next/image';

export type CardComponentProps = {
  title: string;
  content?: any;
  image?: string;
};

export default function CardComponent({
  title,
  content,
  image,
}: CardComponentProps) {
  return (
    <>
      <div className="block rounded-xl bg-white shadow-md dark:bg-neutral-700 transition-all duration-200">
        {image && (
          <div className="rounded-t-xl aspect-[4/3] overflow-hidden">
            <Image src={image} width={300} height={400} alt="" className="object-cover w-full h-full" />
          </div>
        )}

        <div className="p-7">
          <h5 className="mb-2 text-xl font-bold leading-tight text-slate-800 dark:text-slate-50 tracking-wide">
            {title}
          </h5>
          <p className="mb-2 text-base text-slate-600 dark:text-slate-200">
            {content}
          </p>
        </div>
      </div>
    </>
  );
}
