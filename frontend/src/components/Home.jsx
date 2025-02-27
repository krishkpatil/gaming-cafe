import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Button,
  Flex,
  Text,
  useDisclosure,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { getAllFriends } from '../services/friendService';
import FriendCard from './FriendCard';
import CreateFriendModal from './CreateFriendModal';

const Home = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, logout } = useAuth();
  const toast = useToast();

  // Fetch friends on component mount
  useEffect(() => {
    fetchFriends();
  }, []);

  // Fetch friends from API
  const fetchFriends = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAllFriends();
      setFriends(response.friends || []);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle friend creation
  const handleFriendCreated = (newFriend) => {
    setFriends([...friends, newFriend]);
  };

  // Handle friend update
  const handleFriendUpdated = (updatedFriend) => {
    setFriends(friends.map(friend => 
      friend.id === updatedFriend.id ? updatedFriend : friend
    ));
  };

  // Handle friend deletion
  const handleFriendDeleted = (friendId) => {
    setFriends(friends.filter(friend => friend.id !== friendId));
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header section */}
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl">My Friends</Heading>
        
        <Flex>
          {user && (
            <Button 
              colorScheme="blue" 
              leftIcon={<AddIcon />} 
              onClick={onOpen} 
              mr={4}
            >
              Add Friend
            </Button>
          )}
          
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </Flex>
      </Flex>
      
      {/* User info */}
      {user && (
        <Box mb={6} p={4} bg="blue.50" borderRadius="md">
          <Text>
            Logged in as: <strong>{user.username}</strong>
            {user.is_admin && (
              <Badge ml={2} colorScheme="green">Admin</Badge>
            )}
          </Text>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <AlertTitle mr={2}>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading state */}
      {loading ? (
        <Flex justifyContent="center" alignItems="center" minH="50vh">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      ) : (
        // Friends grid
        <>
          {friends.length === 0 ? (
            <Box textAlign="center" py={10}>
              <Text fontSize="xl">No friends found.</Text>
              <Text mt={2}>Click the "Add Friend" button to create your first friend.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {friends.map(friend => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onFriendUpdated={handleFriendUpdated}
                  onFriendDeleted={handleFriendDeleted}
                />
              ))}
            </SimpleGrid>
          )}
        </>
      )}
      
      {/* Create Friend Modal */}
      <CreateFriendModal
        isOpen={isOpen}
        onClose={onClose}
        onFriendCreated={handleFriendCreated}
      />
    </Container>
  );
};

export default Home;