import React from 'react';
import {
  Box,
  Image,
  Text,
  Heading,
  Stack,
  Badge,
  IconButton,
  useDisclosure,
  Flex,
  useToast
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { deleteFriend } from '../services/friendService';
import EditFriendModal from './EditFriendModal';

const FriendCard = ({ friend, onFriendUpdated, onFriendDeleted }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();

  // Check if the current user is an admin or the creator of this friend
  const canModify = user?.is_admin || user?.id === friend.created_by;

  const handleDeleteFriend = async () => {
    if (window.confirm(`Are you sure you want to delete ${friend.name}?`)) {
      try {
        await deleteFriend(friend.id);
        toast({
          title: 'Friend deleted',
          description: `${friend.name} has been deleted successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        if (onFriendDeleted) {
          onFriendDeleted(friend.id);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box
      maxW="sm"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      p={4}
      position="relative"
    >
      <Image
        src={friend.imgUrl || 'https://via.placeholder.com/150'}
        alt={friend.name}
        borderRadius="full"
        boxSize="150px"
        mx="auto"
        my={2}
      />
      <Stack mt={4} spacing={2} align="center">
        <Heading size="md">{friend.name}</Heading>
        <Badge colorScheme="blue">{friend.role}</Badge>
        <Text textAlign="center" noOfLines={3}>{friend.description}</Text>
        <Text fontSize="sm" color="gray.500">
          Gender: {friend.gender.charAt(0).toUpperCase() + friend.gender.slice(1)}
        </Text>
      </Stack>
      {canModify && (
        <Flex position="absolute" top={2} right={2}>
          <IconButton
            icon={<EditIcon />}
            size="sm"
            colorScheme="blue"
            aria-label="Edit friend"
            mr={1}
            onClick={onOpen}
          />
          <IconButton
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            aria-label="Delete friend"
            onClick={handleDeleteFriend}
          />
        </Flex>
      )}
      <EditFriendModal
        isOpen={isOpen}
        onClose={onClose}
        friend={friend}
        onFriendUpdated={onFriendUpdated}
      />
    </Box>
  );
};

export default FriendCard;