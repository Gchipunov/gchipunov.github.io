#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
// "meta_server on ubuntu"
#define BUFFER_SIZE 1024
#define PORT 8090

int main() {

	int sockfd;
	struct sockaddr_in server_addr, client_addr;
	socklen_t client_len = sizeof(client_addr);
	char buffer[BUFFER_SIZE];

	// Create UDP socket
	sockfd = socket(AF_INET, SOCK_DGRAM, 0 );
	if (sockfd < 0)
	{
		perror("socket creation failed");
		exit(1);
	}

	printf("Server listening on port %d...\n", PORT);

	while(1) {
	// Receive message from client
	int bytes_received = recvfrom(sockfd, buffer, BUFFER_SIZE, 0 ,(struct sockaddr * )&client_Addr, &client_len)
	if(bytes_received < 0)
	{
	perror("recvfrom failed");
	continue;
	}

	buffer[bytes_received] = '\0';
	printf("Receieved message from client: %s\n" ,buffer);

	//Send response back to client
	int bytes_sent = sendto(sockfd, buffer, bytes_received, 0, (struct sockaddr * ) &client_addr , &client_len);

	if(bytes_sent < 0)
	{
	perror("recvfrom failed");
	}


	}
	
	return 0;



}
