package com.squarefeetx.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiGatewayApplication {

	public static void main(String[] args) {
		PortKiller.cleanPort(8002);
		SpringApplication.run(ApiGatewayApplication.class, args);
	}

}

class PortKiller {
    public static void cleanPort(int port) {
        if (isPortInUse(port)) {
            System.out.println("Port " + port + " is already in use. Attempting to free it...");
            killProcessOnPort(port);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private static boolean isPortInUse(int port) {
        try (java.net.ServerSocket ignored = new java.net.ServerSocket(port)) {
            return false;
        } catch (java.io.IOException e) {
            return true;
        }
    }

    private static void killProcessOnPort(int port) {
        try {
            String os = System.getProperty("os.name").toLowerCase();
            if (os.contains("win")) {
                ProcessBuilder builder = new ProcessBuilder("cmd.exe", "/c", "netstat -ano | findstr LISTENING | findstr :" + port);
                Process process = builder.start();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty()) continue;
                        String[] parts = line.split("\\s+");
                        if (parts.length > 1) {
                            String localAddress = parts[1];
                            if (localAddress.endsWith(":" + port)) {
                                String pid = parts[parts.length - 1];
                                long currentPid = ProcessHandle.current().pid();
                                if (Long.parseLong(pid) == currentPid) {
                                    continue;
                                }
                                System.out.println("Port " + port + " is held by PID " + pid + ". Terminating process...");
                                new ProcessBuilder("taskkill", "/F", "/PID", pid).start().waitFor();
                            }
                        }
                    }
                }
            } else {
                ProcessBuilder builder = new ProcessBuilder("sh", "-c", "lsof -t -i :" + port);
                Process process = builder.start();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                    String pid;
                    while ((pid = reader.readLine()) != null) {
                        pid = pid.trim();
                        if (!pid.isEmpty()) {
                            long currentPid = ProcessHandle.current().pid();
                            if (Long.parseLong(pid) == currentPid) {
                                continue;
                            }
                            System.out.println("Port " + port + " is held by PID " + pid + ". Terminating process...");
                            new ProcessBuilder("kill", "-9", pid).start().waitFor();
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to clean port " + port + ": " + e.getMessage());
        }
    }
}
