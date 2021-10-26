import { Box, Flex, Text } from "@chakra-ui/react";
import React, { useContext, useState } from "react";
import { UserContext } from "../../contexts/UserContext";
import "./Message.scss";

type MessageProps = {
  message: string;
  messageAddress: string;
  time: string;
};

const Message = ({ message, messageAddress, time }: MessageProps) => {
  const { publicAddress } = useContext(UserContext);

  const [sent, setSent] = useState(publicAddress === messageAddress);

  return (
    <Flex width="100%">
      {/* sent ? <Spacer /> : <></> */}
      <Box marginLeft={sent ? "auto" : "0"}>
        <Text color="#525252" fontSize="xs" marginBottom="-1">
          {time}
        </Text>
        <Text color="#525252" fontSize="xs" marginBottom="-1">
          {messageAddress}
        </Text>
        <Box
          borderRadius={sent ? "15px 15px 0px 15px" : "15px 15px 15px 0"}
          width={"25vw"}
          backgroundColor={sent ? "#0324FF" : "#525252"}
          color="white"
          marginY="3"
          marginLeft="0"
          paddingX="4"
          paddingY="2px"
        >
          <Text marginY="4" size="20px">
            {message}
          </Text>
        </Box>
      </Box>
    </Flex>
  );
};

export default Message;
