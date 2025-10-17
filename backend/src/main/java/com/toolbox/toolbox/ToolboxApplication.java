package com.toolbox.toolbox;

import com.toolbox.toolbox.security.RsaKeyProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(RsaKeyProperties.class)
public class ToolboxApplication {

	public static void main(String[] args) {
		SpringApplication.run(ToolboxApplication.class, args);
	}

}
