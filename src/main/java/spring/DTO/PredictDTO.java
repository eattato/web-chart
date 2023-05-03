package spring.DTO;

import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Getter;
import lombok.Setter;

@JsonNaming
@Getter
@Setter
public class PredictDTO {
    private String location;
    private int month;
    private float temperature;
    private float humidity;
}
