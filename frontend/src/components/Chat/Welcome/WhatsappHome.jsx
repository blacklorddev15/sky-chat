import { Logo } from "../../../svg";

export default function WhatsappHome() {
  return (
    <div className="h-full w-full dark:bg-dark_bg_4 select-none border-l dark:border-l-dark_border_2 border-b-[6px] border-b-green_2">
      {/*Container*/}
      <div className="-mt-1.5 w-full h-full flex flex-col gap-y-8 items-center justify-center">
        <span>
          <Logo />
        </span>
        {/*Infos*/}
        <div className="mt-1 text-center space-y-[12px]">
          <h1 className="text-[32px] dark:text-dark_text_4 font-extralight">
            Sky Chat Web
          </h1>
          <p className="text-sm dark:text-dark_text_3">
            Send and receive messages in real time, in one-to-one or group chats.
            <br />
            Sign in from any browser and pick up the conversation where you left off.
          </p>
        </div>
      </div>
    </div>
  );
}
