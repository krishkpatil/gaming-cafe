import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  Text,
  useDisclosure,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  Tag,
  IconButton,
  HStack,
  Progress,
  Card,
  CardHeader,
  CardBody
} from '@chakra-ui/react';
import { AddIcon, TimeIcon, RepeatIcon } from '@chakra-ui/icons';
import { getAllSessions, getActiveSessions, endSession } from '../services/sessionService';
import StartSessionModal from './StartSessionModal';
import { useAuth } from '../contexts/AuthContext';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user } = useAuth();
  const toast = useToast();
  const timerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // Fetch sessions on component mount
  useEffect(() => {
    fetchActiveSessions();
    
    // Set up timer to refresh active sessions every 30 seconds
    timerRef.current = setInterval(() => {
      fetchActiveSessions(false); // Don't show loading spinner for refreshes
    }, 30000);
    
    // Set up timer to update time displays every minute without API call
    refreshTimerRef.current = setInterval(() => {
      setSessions(prevSessions => [...prevSessions]);
    }, 60000);
    
    // Clean up timers on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  // Fetch active sessions from API
  const fetchActiveSessions = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await getActiveSessions();
      setSessions(response.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions. Please try again later.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Handle session creation
  const handleSessionCreated = (newSession) => {
    setSessions([...sessions, newSession]);
  };

  // Calculate time remaining data for active sessions
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
    
    // Calculate percentage for progress bar
    // Assuming max session time is 8 hours (480 minutes)
    const maxSessionMinutes = 480;
    const percentage = Math.min(100, (totalMinutes / maxSessionMinutes) * 100);
    
    // Determine status for color coding
    let status = "normal";
    if (totalMinutes <= 15) {
      status = "critical";
    } else if (totalMinutes <= 30) {
      status = "warning";
    }
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted,
      percentage,
      status
    };
  };
  
  // Calculate estimated cost for active sessions
  const calculateEstimatedCost = (startTime, hourlyRate) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    
    // Calculate hours (including partial)
    const hours = diffMs / (1000 * 60 * 60);
    
    // Round up to nearest 15 minutes (0.25 hours)
    const roundedHours = Math.ceil(hours * 4) / 4;
    
    // Calculate cost
    const cost = roundedHours * hourlyRate;
    
    return cost.toFixed(2);
  };
  
  // Handle ending a session
  const handleEndSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to end this session?')) {
      try {
        await endSession(sessionId);
        
        // Refresh the session list
        fetchActiveSessions();
        
        toast({
          title: 'Session ended',
          description: 'The session has been ended successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err.toString(),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Handle refreshing sessions
  const handleRefresh = () => {
    fetchActiveSessions(true);
    toast({
      title: 'Sessions refreshed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Get progress color based on remaining time status
  const getProgressColor = (status) => {
    switch (status) {
      case "critical":
        return "red";
      case "warning":
        return "orange";
      default:
        return "blue";
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header section */}
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl">Session Management</Heading>
        
        <Flex>
          <IconButton
            icon={<RepeatIcon />}
            colorScheme="blue"
            onClick={handleRefresh}
            mr={4}
            aria-label="Refresh sessions"
          />
          <Button 
            colorScheme="blue" 
            leftIcon={<AddIcon />} 
            onClick={onOpen}
          >
            Start New Session
          </Button>
        </Flex>
      </Flex>
      
      {/* Error message */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}
      
      {/* Loading state */}
      {loading ? (
        <Flex justifyContent="center" alignItems="center" minH="50vh">
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
        </Flex>
      ) : (
        // Sessions table
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>User</Th>
                <Th>Machine</Th>
                <Th>Started At</Th>
                <Th>Time Remaining</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sessions.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">No active sessions found</Td>
                </Tr>
              ) : (
                sessions.map(session => {
                  const timeData = calculateTimeRemainingData(session);
                  return (
                    <Tr key={session.id}>
                      <Td>{session.id}</Td>
                      <Td>{session.username}</Td>
                      <Td>
                        <HStack>
                          <Text>{session.machine_name}</Text>
                          <Tag colorScheme="blue" size="sm">{session.machine_type}</Tag>
                        </HStack>
                      </Td>
                      <Td>{new Date(session.start_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</Td>
                      <Td>
                        <Box>
                          <HStack mb={1}>
                            <TimeIcon />
                            <Text fontWeight="bold" color={timeData.status === "critical" ? "red.500" : undefined}>
                              {timeData.formatted} left
                            </Text>
                          </HStack>
                          <Progress 
                            value={timeData.percentage} 
                            size="sm" 
                            colorScheme={getProgressColor(timeData.status)}
                          />
                        </Box>
                      </Td>
                      <Td>

                                  <Badge colorScheme={session.is_active ? 'green' : 'gray'} ml={2}>
                                      {session.is_active ? 'ACTIVE' : 'ENDED'}
                                  </Badge>

                      </Td>
                      <Td>
                        <Button
                          colorScheme="red"
                          size="sm"
                          onClick={() => handleEndSession(session.id)}
                        >
                          End Session
                        </Button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* Start Session Modal */}
      <StartSessionModal
        isOpen={isOpen}
        onClose={onClose}
        onSessionCreated={handleSessionCreated}
      />
    </Container>
  );
};

export default SessionManagement;