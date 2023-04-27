package spring.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PredictDTO {
    private String location;
    private int month;
    private float temperature;
    private float humidity;
}
