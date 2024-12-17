import "./Messages.css";

import Header from "../../components/Header/Header";
import Breadcrumb from "../../components/ui/BreadCrumb/BreadCrumb";
import ChatBox from "../../components/ui/ChatBox/ChatBox";

export default function Messages() {
  return (
    <>
      <Header showPropertyOptions={false} showSearch={false} />
      <section className="messages-section">
        <Breadcrumb />
        <ChatBox />
      </section>
    </>
  );
}
