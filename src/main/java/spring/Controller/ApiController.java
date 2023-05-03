package spring.Controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import spring.DTO.PredictDTO;

@RestController
public class ApiController {
    private String dtoToJson(Object data) {
        try {
            String result = new ObjectMapper().writeValueAsString(data);
            System.out.println("Successfully converted data into JSON. " + result);
            return result;
        } catch (Exception e) {
            System.out.println("Failed to convert data into JSON format. " + e.getMessage());
            return "";
        }
    }

    private String request(String url, Object body) {
        HttpHeaders header = new HttpHeaders();
        header.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(dtoToJson(body), header);

        try {
            RestTemplate template = new RestTemplate();
            ResponseEntity<String> response = template.postForEntity(url, request, String.class);
            return response.getBody().toString();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.out.println("Predict request failed. " + e.getMessage());
            return "Predict request failed.";
        }
    }

    @PostMapping("/predict")
    public String predict(@RequestBody PredictDTO data) {
        String url = "http://localhost:8889/predict";
        return request(url, data);
    }
}
