import { Button, Input, Flex } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import StreamrClient from "streamr-client";

import "./Chat.scss";

type Metadata = {
  isTyping: boolean;
  time: number;
  address: string;
};

type Props = {
  address: string;
  client: StreamrClient;
  connectedAddress: string;
};

const Chat = ({ address, client, connectedAddress }: Props) => {
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState([]);
  const [reducedTyping, setReducedTyping] = useState([]);

  const handleSend = () => {
    if (message === "") {
      return;
    }
    setMessage("");
    client.publish(`${connectedAddress}/streamr-chat-messages`, {
      message,
      address,
    });
  };

  const updateMetadata = () => {
    client.publish(
      "0x783c81633290fa641b7bacc5c9cee4c2d709c2e3/streamr-chat-metadata",
      {
        isTyping: true,
        time: new Date().getTime() + 5000,
        address,
      }
    );
  };

  const updateTyping = (m: Metadata) => {
    setTyping((oldArray) => [...oldArray, m]);
  };

  useEffect(() => {
    const clearTyping = setInterval(() => {
      setTyping(
        typing.filter((t) => {
          return t.time > new Date().getTime();
        })
      );
    }, 3000);
    return () => clearInterval(clearTyping);
  }, []);

  useEffect(() => {
    const getMessages = async () => {
      await client.subscribe(
        {
          stream:
            "0x783c81633290fa641b7bacc5c9cee4c2d709c2e3/streamr-chat-metadata",
        },
        updateTyping
      );
    };

    getMessages();
  }, []);

  useEffect(() => {
    const newTyping = [];
    for (var i in typing) {
      let found = false;
      for (var j = 0; j < newTyping.length; j++) {
        if (newTyping[j].address === typing[i].address) {
          found = true;
          break;
        }
      }
      if (!found) {
        newTyping.push(typing[i]);
      }
    }
    setReducedTyping(newTyping);
  }, [typing]);

  return (
    <>
      {/* <div className="inputWrapper">
        {reducedTyping.map((t) => {
          if (address === t.address) {
            return;
          }
          return <p style={{}}>{t.address} is typing...</p>;
        })} */}
      <Flex
        position="fixed"
        bottom="0px"
        direction="row"
        width="container.lg"
        left="50%"
        backgroundColor="white"
        transform="translateX(-50%)"
        paddingY="10px"
      >
        <Input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            // updateMetadata();
          }}
          disabled={connectedAddress === ""}
        ></Input>
        <Button
          type="submit"
          onClick={handleSend}
          bgColor="#ff5c00"
          color="white"
          disabled={connectedAddress === ""}
          paddingX="30px"
          marginLeft="10px"
        >
          Send
        </Button>
      </Flex>
    </>
  );
};

export default Chat;
