package spring.Controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import spring.DTO.PredictDTO;
import spring.DTO.ResultDTO;

import java.util.Collections;

@RestController
public class ApiController {
    private String request(String url) {
        RestTemplate template = new RestTemplate();
        HttpHeaders header = new HttpHeaders();
        header.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        HttpEntity<String> entity = new HttpEntity<>("parameters", header);
        ResponseEntity<?> result = template.exchange(url, HttpMethod.POST, entity, ResultDTO.class);
        return result.getBody().toString();
    }

    @PostMapping
    public String predict(@RequestBody PredictDTO data, RedirectAttributes redirect) {
        String url = "localhost:8889/predict";
        return request(url);
    }
}
