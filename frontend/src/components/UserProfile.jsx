import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Spinner,
  Avatar,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Grid,
  GridItem,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Icon
} from '@chakra-ui/react';
import { TimeIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { getUserById } from '../services/userService';
import { getTransactions } from '../services/dashboardService';
import { getActiveSessions } from '../services/sessionService';

const UserProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Get fresh user data
        const userData = await getUserById(user.id);
        setProfileData(userData.user);
        
        // Get user transactions
        const transactionData = await getTransactions();
        setTransactions(transactionData.transactions || []);
        
        // Get active sessions
        const sessionData = await getActiveSessions();
        setActiveSessions(sessionData.sessions || []);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  // Calculate time remaining for active sessions
  const calculateTimeRemainingData = (session) => {
    if (!session || !session.start_time || !session.hourly_rate || session.hourly_rate <= 0) {
      return {
        hours: 0,
        minutes: 0,
        totalMinutes: 0,
        formatted: "00:00",
        percentage: 0,
        status: "expired"
      };
    }
    
    // Get user balance from session
    const userBalance = session.user_balance || 0;
    
    // Calculate elapsed time in hours
    const start = new Date(session.start_time);
    const now = new Date();
    const elapsedHours = (now - start) / (1000 * 60 * 60);
    
    // Calculate cost so far
    const costSoFar = elapsedHours * session.hourly_rate;
    
    // Calculate remaining balance
    const remainingBalance = Math.max(0, userBalance - costSoFar);
    
    // Calculate remaining time
    const remainingHours = remainingBalance / session.hourly_rate;
    
    // Convert to hours and minutes
    const hours = Math.floor(remainingHours);
    const minutes = Math.floor((remainingHours - hours) * 60);
    const totalMinutes = hours * 60 + minutes;
    
    // Format as HH:MM
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formatted = `${formattedHours}:${formattedMinutes}`;
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted,
      percentage: 0,
      status: totalMinutes <= 15 ? "critical" : totalMinutes <= 30 ? "warning" : "normal"
    };
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Flex justifyContent="center" alignItems="center" minH="50vh">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" size="xl" mb={8}>My Profile</Heading>
      
      {error && (
        <Box mb={6} p={4} bg="red.50" borderRadius="md" color="red.500">
          <Text>{error}</Text>
        </Box>
      )}
      
      {profileData && (
        <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={8}>
          {/* Profile Info Card */}
          <GridItem>
            <Card>
              <CardHeader>
                <Heading size="md">Profile Info</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="center">
                  <Avatar 
                    size="2xl" 
                    name={profileData.username}
                    src={profileData.img_url}
                  />
                  <VStack spacing={1} align="center">
                    <Heading size="md">{profileData.username}</Heading>
                    <Badge colorScheme={profileData.is_admin ? "purple" : "blue"}>
                      {profileData.is_admin ? "Administrator" : "User"}
                    </Badge>
                  </VStack>
                  
                  <Divider />
                  
                  <Stat textAlign="center">
                    <StatLabel>Current Balance</StatLabel>
                    <StatNumber>${profileData.balance?.toFixed(2) || '0.00'}</StatNumber>
                    <StatHelpText>Available for gaming sessions</StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
          
          {/* Active Sessions & Transaction History */}
          <GridItem>
            <VStack spacing={8} align="stretch">
              {/* Active Sessions */}
              <Card>
                <CardHeader>
                  <Heading size="md">Active Sessions</Heading>
                </CardHeader>
                <CardBody>
                  {activeSessions.length === 0 ? (
                    <Text textAlign="center" py={4} color="gray.500">
                      You don't have any active sessions
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Machine</Th>
                          <Th>Started At</Th>
                          <Th>Time Remaining</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {activeSessions.map(session => {
                          const timeData = calculateTimeRemainingData(session);
                          return (
                            <Tr key={session.id}>
                              <Td>
                                <HStack>
                                  <Text>{session.machine_name}</Text>
                                  <Badge colorScheme="blue" size="sm">
                                    {session.machine_type}
                                  </Badge>
                                </HStack>
                              </Td>
                              <Td>{new Date(session.start_time).toLocaleString()}</Td>
                              <Td>
                                <HStack>
                                  <TimeIcon />
                                  <Text color={
                                    timeData.status === "critical" ? "red.500" : 
                                    timeData.status === "warning" ? "orange.500" : 
                                    "inherit"
                                  }>
                                    {timeData.formatted} left
                                  </Text>
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
              
              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <Heading size="md">Recent Transactions</Heading>
                </CardHeader>
                <CardBody>
                  {transactions.length === 0 ? (
                    <Text textAlign="center" py={4} color="gray.500">
                      No transaction history available
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Type</Th>
                          <Th>Description</Th>
                          <Th isNumeric>Amount</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {transactions.slice(0, 5).map(transaction => (
                          <Tr key={transaction.id}>
                            <Td>{new Date(transaction.timestamp).toLocaleDateString()}</Td>
                            <Td>
                              {transaction.transaction_type === 'deposit' ? (
                                <Badge colorScheme="green">Deposit</Badge>
                              ) : (
                                <Badge colorScheme="blue">Session</Badge>
                              )}
                            </Td>
                            <Td>{transaction.description}</Td>
                            <Td isNumeric color={transaction.amount > 0 ? "green.500" : "inherit"}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </GridItem>
        </Grid>
      )}
    </Container>
  );
};

export default UserProfile;